#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const [manifestArg, outputArg] = process.argv.slice(2);
if (!manifestArg) {
  console.error('Usage: node render.mjs <video-manifest.json> [output.mp4]');
  process.exit(1);
}

const manifestPath = path.resolve(manifestArg);
const baseDir = path.dirname(manifestPath);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const output = path.resolve(outputArg || path.join(baseDir, `${manifest.episode?.id || 'motion-manga'}.mp4`));
const width = Number(manifest.format?.width || 1080);
const height = Number(manifest.format?.height || 1920);
const fps = Number(manifest.format?.fps || 30);
const defaultDuration = Number(manifest.defaults?.duration || 5.5);
const tailPadding = Number(manifest.defaults?.tailPadding || 0.35);
const scenes = Array.isArray(manifest.scenes) ? manifest.scenes : [];

if (!scenes.length) throw new Error('Manifest has no scenes.');

function run(bin, args, options = {}) {
  const result = spawnSync(bin, args, { stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${bin} exited with status ${result.status}`);
}

function capture(bin, args) {
  const result = spawnSync(bin, args, { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${bin} exited with status ${result.status}: ${result.stderr}`);
  return result.stdout.trim();
}

capture('ffmpeg', ['-version']);
capture('ffprobe', ['-version']);

function audioDuration(file) {
  const text = capture('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    file
  ]);
  const value = Number(text);
  return Number.isFinite(value) ? value : 0;
}

function motionFilter(motion) {
  const base = `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1`;
  if (motion === 'zoom-in') {
    return `${base},zoompan=z='min(zoom+0.0008,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${width}x${height}:fps=${fps},format=yuv420p`;
  }
  if (motion === 'zoom-out') {
    return `${base},zoompan=z='if(lte(on,1),1.08,max(zoom-0.0008,1.0))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${width}x${height}:fps=${fps},format=yuv420p`;
  }
  return `${base},fps=${fps},format=yuv420p`;
}

function srtTime(seconds) {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const hh = Math.floor(ms / 3600000);
  const mm = Math.floor((ms % 3600000) / 60000);
  const ss = Math.floor((ms % 60000) / 1000);
  const mmm = ms % 1000;
  return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')},${String(mmm).padStart(3,'0')}`;
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdkamato-motion-manga-'));
const concatFile = path.join(tempDir, 'concat.txt');
const roughVideo = path.join(tempDir, 'rough.mp4');
const rendered = [];
const captions = [];
let cursor = 0;

try {
  scenes.forEach((scene, index) => {
    const image = path.resolve(baseDir, scene.image);
    if (!fs.existsSync(image)) throw new Error(`Missing image: ${image}`);

    const audio = scene.audio ? path.resolve(baseDir, scene.audio) : null;
    if (audio && !fs.existsSync(audio)) throw new Error(`Missing audio: ${audio}`);

    const declared = Number(scene.duration || defaultDuration);
    const duration = audio ? Math.max(declared, audioDuration(audio) + tailPadding) : declared;
    const segment = path.join(tempDir, `scene-${String(index + 1).padStart(3,'0')}.mp4`);

    const args = ['-y', '-loop', '1', '-framerate', String(fps), '-i', image];
    if (audio) {
      args.push('-i', audio);
    } else {
      args.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000');
    }

    args.push(
      '-vf', motionFilter(scene.motion || 'hold'),
      '-t', duration.toFixed(3),
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-ar', '48000',
      '-ac', '2',
      '-b:a', '160k'
    );

    if (audio) args.push('-af', 'apad');
    args.push('-shortest', segment);
    run('ffmpeg', args);
    rendered.push(segment);

    const narration = String(scene.narration || '').trim();
    if (narration) {
      captions.push({
        start: cursor,
        end: cursor + duration,
        text: narration
      });
    }
    cursor += duration;
  });

  fs.writeFileSync(
    concatFile,
    rendered.map((file) => `file '${file.replaceAll("'", "'\\''")}'`).join('\n') + '\n',
    'utf8'
  );

  run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', concatFile, '-c', 'copy', roughVideo]);

  const bgm = manifest.bgm ? path.resolve(baseDir, manifest.bgm) : null;
  if (bgm) {
    if (!fs.existsSync(bgm)) throw new Error(`Missing BGM: ${bgm}`);
    const bgmVolume = Number(manifest.bgmVolume ?? 0.10);
    run('ffmpeg', [
      '-y',
      '-i', roughVideo,
      '-stream_loop', '-1', '-i', bgm,
      '-filter_complex', `[1:a]volume=${bgmVolume}[music];[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[a]`,
      '-map', '0:v:0',
      '-map', '[a]',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '160k',
      '-shortest',
      output
    ]);
  } else {
    fs.copyFileSync(roughVideo, output);
  }

  if (captions.length) {
    const srt = captions.map((caption, index) =>
      `${index + 1}\n${srtTime(caption.start)} --> ${srtTime(caption.end)}\n${caption.text}\n`
    ).join('\n');
    const srtPath = output.replace(/\.mp4$/i, '') + '.srt';
    fs.writeFileSync(srtPath, srt, 'utf8');
    console.log(`Captions: ${srtPath}`);
  }

  console.log(`Rendered: ${output}`);
  console.log(`Duration: ~${cursor.toFixed(1)}s`);
} finally {
  if (process.env.KEEP_VIDEO_WORKDIR === '1') {
    console.log(`Workdir kept: ${tempDir}`);
  } else {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
