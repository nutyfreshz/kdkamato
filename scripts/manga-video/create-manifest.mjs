#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const [inputDirArg, outputArg] = process.argv.slice(2);
if (!inputDirArg) {
  console.error('Usage: node create-manifest.mjs <image-folder> [output-manifest.json]');
  process.exit(1);
}

const inputDir = path.resolve(inputDirArg);
const output = path.resolve(outputArg || path.join(inputDir, 'video-manifest.json'));
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const extensions = new Set(['.png', '.jpg', '.jpeg', '.webp']);

const images = fs.readdirSync(inputDir)
  .filter((name) => extensions.has(path.extname(name).toLowerCase()))
  .sort(collator.compare);

if (!images.length) {
  throw new Error(`No supported images found in ${inputDir}`);
}

const motions = ['zoom-in', 'hold', 'zoom-out'];
const outputDir = path.dirname(output);

const manifest = {
  version: '0.1',
  episode: {
    id: path.basename(inputDir),
    title: ''
  },
  format: {
    width: 1080,
    height: 1920,
    fps: 30
  },
  defaults: {
    duration: 5.5,
    tailPadding: 0.35
  },
  bgm: null,
  bgmVolume: 0.10,
  scenes: images.map((name, index) => ({
    id: `scene-${String(index + 1).padStart(2, '0')}`,
    image: path.relative(outputDir, path.join(inputDir, name)),
    audio: null,
    duration: 5.5,
    motion: motions[index % motions.length],
    narration: ''
  }))
};

fs.writeFileSync(output, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`Created ${output} with ${images.length} scenes.`);
console.log('Next: add narration/audio per scene, then run video:render.');
