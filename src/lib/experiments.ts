import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import type { ExperimentMeta } from './define';

export type { ExperimentMeta };

export interface Experiment extends ExperimentMeta {
  slug: string;
  Component: AstroComponentFactory;
}

const metaModules = import.meta.glob<{ default: ExperimentMeta }>('../experiments/*/meta.ts', {
  eager: true,
});
const componentModules = import.meta.glob<{ default: AstroComponentFactory }>(
  '../experiments/*/index.astro',
  { eager: true },
);

const slugFrom = (path: string) => path.split('/').at(-2)!;

export function getExperiments(): Experiment[] {
  return Object.entries(componentModules)
    .map(([path, mod]) => {
      const slug = slugFrom(path);
      const meta = metaModules[path.replace(/index\.astro$/, 'meta.ts')]?.default;
      if (!meta) {
        throw new Error(`Experiment "${slug}" is missing a meta.ts file.`);
      }
      return { ...meta, slug, Component: mod.default };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Prefix a site-relative path with the configured base. */
export const url = (path: string) =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

export const screenshotPath = (slug: string) => `screenshots/${slug}.jpg`;
