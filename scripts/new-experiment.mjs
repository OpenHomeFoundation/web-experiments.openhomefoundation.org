#!/usr/bin/env node
// Usage: npm run new -- my-experiment "My Experiment"
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';

const [slug, title = slug] = process.argv.slice(2);

if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: npm run new -- <kebab-case-slug> ["Title"]');
  process.exit(1);
}

const dir = new URL(`../src/experiments/${slug}/`, import.meta.url);
if (existsSync(dir)) {
  console.error(`Experiment "${slug}" already exists.`);
  process.exit(1);
}

await mkdir(dir, { recursive: true });
await writeFile(
  new URL('meta.ts', dir),
  `import { defineExperiment } from '../../lib/define';

export default defineExperiment({
  title: ${JSON.stringify(title)},
  description: 'TODO: describe what this experiment explores.',
  date: '${new Date().toISOString().slice(0, 10)}',
  tags: [],
});
`,
);
await writeFile(
  new URL('index.astro', dir),
  `<div class="stage">
  <p>${title}</p>
</div>

<style>
  .stage {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }
</style>

<script>
  // Client-side code for the experiment goes here.
</script>
`,
);

console.log(`Created src/experiments/${slug}/ — open http://localhost:4321/experiments/${slug}/`);
