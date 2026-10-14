import type { AstroIntegration } from 'astro';
import { createReadStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const VIEWPORT = { width: 1280, height: 800 };
const CONCURRENCY = 4;

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.mp4': 'video/mp4',
  '.glsl': 'text/plain',
};

/** Minimal static file server for the build output, mounted at `base`. */
function serveDir(root: string, base: string): Promise<Server> {
  const server = createServer(async (req, res) => {
    let pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    if (!pathname.startsWith(base)) {
      res.writeHead(404).end();
      return;
    }
    pathname = pathname.slice(base.length);
    let file = normalize(join(root, pathname));
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      await stat(file);
    } catch {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[extname(file)] ?? 'application/octet-stream',
    });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/**
 * After `astro build`, opens every page under /experiments/ in headless
 * Chromium and saves a screenshot to `dist/screenshots/<slug>.jpg`, which the
 * homepage cards use as their preview image.
 *
 * Set SKIP_SCREENSHOTS=1 to skip, or CHROMIUM_PATH to use a specific browser.
 */
export default function screenshots(): AstroIntegration {
  let base = '/';

  return {
    name: 'experiment-screenshots',
    hooks: {
      'astro:config:done': ({ config }) => {
        base = config.base.endsWith('/') ? config.base : `${config.base}/`;
      },
      'astro:build:done': async ({ dir, pages, logger }) => {
        if (process.env.SKIP_SCREENSHOTS) {
          logger.info('SKIP_SCREENSHOTS is set, skipping.');
          return;
        }

        const slugs = pages
          .map(({ pathname }) => pathname.match(/^experiments\/([^/]+)\/?$/)?.[1])
          .filter((slug): slug is string => Boolean(slug));
        if (slugs.length === 0) return;

        let chromium: typeof import('playwright').chromium;
        try {
          ({ chromium } = await import('playwright'));
        } catch {
          logger.warn('Playwright is not installed, skipping screenshots.');
          return;
        }

        const root = fileURLToPath(dir);
        const outDir = join(root, 'screenshots');
        await mkdir(outDir, { recursive: true });

        const server = await serveDir(root, base);
        const { port } = server.address() as AddressInfo;
        let browser;
        try {
          browser = await chromium.launch({
            executablePath: process.env.CHROMIUM_PATH || undefined,
          });
        } catch (error) {
          server.close();
          logger.warn(
            `Could not launch Chromium, skipping screenshots. ` +
              `Run "npx playwright install chromium" or set CHROMIUM_PATH.\n${error}`,
          );
          return;
        }

        try {
          const context = await browser.newContext({
            viewport: VIEWPORT,
            colorScheme: 'dark',
            reducedMotion: 'no-preference',
          });
          const start = performance.now();

          const queue = [...slugs];
          const capture = async (slug: string) => {
            const page = await context.newPage();
            try {
              await page.goto(`http://127.0.0.1:${port}${base}experiments/${slug}/?screenshot`, {
                waitUntil: 'networkidle',
                timeout: 30_000,
              });
              const delay = Number(
                await page.locator('#experiment').getAttribute('data-screenshot-delay'),
              );
              await page.waitForTimeout(500 + (delay || 0));
              await page.screenshot({
                path: join(outDir, `${slug}.jpg`),
                type: 'jpeg',
                quality: 80,
              });
              logger.info(`📸 ${slug}`);
            } catch (error) {
              logger.warn(`Failed to screenshot "${slug}": ${error}`);
            } finally {
              await page.close();
            }
          };
          await Promise.all(
            Array.from({ length: CONCURRENCY }, async () => {
              for (let slug; (slug = queue.shift());) await capture(slug);
            }),
          );

          logger.info(
            `Captured ${slugs.length} screenshot(s) in ${Math.round(performance.now() - start)}ms.`,
          );
        } finally {
          await browser.close();
          server.close();
        }
      },
    },
  };
}
