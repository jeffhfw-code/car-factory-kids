// Generates plain colored-square PNGs for the PWA placeholder icon set.
// Replace these with real artwork in a later phase.
// Run: node scripts/generate-placeholder-icons.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync, crc32 } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const PRIMARY = [0x3f, 0xa9, 0xf5]; // sky blue
const ACCENT = [0xff, 0xc9, 0x3c]; // sunshine yellow

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcSrc = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcSrc) >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makeSquarePng(size, [r, g, b], { border } = {}) {
  // RGBA raster, one filter byte per row.
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  const borderPx = border ? Math.max(1, Math.floor(size / 16)) : 0;
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const o = y * (stride + 1) + 1 + x * 4;
      const onBorder =
        border &&
        (x < borderPx || y < borderPx || x >= size - borderPx || y >= size - borderPx);
      if (onBorder) {
        raw[o] = ACCENT[0];
        raw[o + 1] = ACCENT[1];
        raw[o + 2] = ACCENT[2];
      } else {
        raw[o] = r;
        raw[o + 1] = g;
        raw[o + 2] = b;
      }
      raw[o + 3] = 0xff;
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const idat = deflateSync(raw);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const targets = [
  { name: 'icon-192.png', size: 192, color: PRIMARY, border: true },
  { name: 'icon-512.png', size: 512, color: PRIMARY, border: true },
  { name: 'icon-maskable.png', size: 512, color: PRIMARY, border: false },
  { name: 'apple-touch-icon.png', size: 180, color: PRIMARY, border: true },
];

for (const t of targets) {
  const buf = makeSquarePng(t.size, t.color, { border: t.border });
  writeFileSync(resolve(outDir, t.name), buf);
  console.log(`wrote ${t.name} (${t.size}x${t.size}, ${buf.length} bytes)`);
}
