/**
 * Generate PNG icons for the Chrome extension.
 * Uses only Node.js built-ins — no external dependencies.
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { deflateSync } from "zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "../icons");
mkdirSync(iconsDir, { recursive: true });

// --- Minimal PNG encoder ---

function makeCrcTable() {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
}
const CRC_TABLE = makeCrcTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const dataBytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(dataBytes.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, dataBytes])));
  return Buffer.concat([lenBuf, typeBytes, dataBytes, crcBuf]);
}

function encodePNG(width, height, pixels) {
  const IHDR = Buffer.alloc(13);
  IHDR.writeUInt32BE(width,  0);
  IHDR.writeUInt32BE(height, 4);
  IHDR[8]  = 8; // bit depth
  IHDR[9]  = 6; // color type: RGBA
  IHDR[10] = 0; // compression: deflate
  IHDR[11] = 0; // filter: adaptive
  IHDR[12] = 0; // interlace: none

  const rowSize = width * 4;
  const raw = Buffer.alloc((rowSize + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (rowSize + 1)] = 0; // filter type: None
    pixels.copy(raw, y * (rowSize + 1) + 1, y * rowSize, (y + 1) * rowSize);
  }

  const compressed = deflateSync(raw);

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk("IHDR", IHDR),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- Draw ShowsUp "S" icon ---

function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);

  const BG    = [10,  14,  23,  255]; // #0A0E17
  const GREEN = [16,  185, 129, 255]; // #10B981
  const WHITE = [255, 255, 255, 255];

  function set(x, y, col) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    pixels[i]     = col[0];
    pixels[i + 1] = col[1];
    pixels[i + 2] = col[2];
    pixels[i + 3] = col[3];
  }

  // Fill with background
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      set(x, y, BG);

  // Rounded-rect green badge
  const pad = Math.max(1, Math.round(size * 0.08));
  const radius = Math.max(2, Math.round(size * 0.2));
  for (let y = pad; y < size - pad; y++) {
    for (let x = pad; x < size - pad; x++) {
      // Check corners
      const inTopLeft     = x < pad + radius && y < pad + radius;
      const inTopRight    = x >= size - pad - radius && y < pad + radius;
      const inBottomLeft  = x < pad + radius && y >= size - pad - radius;
      const inBottomRight = x >= size - pad - radius && y >= size - pad - radius;

      if (inTopLeft) {
        const dx = x - (pad + radius), dy = y - (pad + radius);
        if (dx * dx + dy * dy > radius * radius) continue;
      } else if (inTopRight) {
        const dx = x - (size - pad - radius), dy = y - (pad + radius);
        if (dx * dx + dy * dy > radius * radius) continue;
      } else if (inBottomLeft) {
        const dx = x - (pad + radius), dy = y - (size - pad - radius);
        if (dx * dx + dy * dy > radius * radius) continue;
      } else if (inBottomRight) {
        const dx = x - (size - pad - radius), dy = y - (size - pad - radius);
        if (dx * dx + dy * dy > radius * radius) continue;
      }

      set(x, y, GREEN);
    }
  }

  // Draw "S" in white
  const lPad = Math.round(size * 0.25);
  const lx = lPad;
  const ly = lPad;
  const lw = size - lPad * 2;
  const lh = size - lPad * 2;
  const sw = Math.max(1, Math.round(lw * 0.22));
  const midy = ly + Math.round(lh / 2) - Math.round(sw / 2);

  // Top horizontal bar
  for (let x = lx; x < lx + lw; x++)
    for (let y = ly; y < ly + sw; y++)
      set(x, y, WHITE);

  // Middle horizontal bar
  for (let x = lx; x < lx + lw; x++)
    for (let y = midy; y < midy + sw; y++)
      set(x, y, WHITE);

  // Bottom horizontal bar
  for (let x = lx; x < lx + lw; x++)
    for (let y = ly + lh - sw; y < ly + lh; y++)
      set(x, y, WHITE);

  // Top-left vertical (top half: from top down to middle)
  for (let y = ly; y < midy + sw; y++)
    for (let x = lx; x < lx + sw; x++)
      set(x, y, WHITE);

  // Bottom-right vertical (bottom half: from middle down to bottom)
  for (let y = midy; y < ly + lh; y++)
    for (let x = lx + lw - sw; x < lx + lw; x++)
      set(x, y, WHITE);

  // Clear top-right of upper half (S curves away)
  for (let y = ly; y < midy; y++)
    for (let x = lx + lw - sw; x < lx + lw; x++)
      set(x, y, GREEN);

  // Clear bottom-left of lower half
  for (let y = midy + sw; y < ly + lh - sw; y++)
    for (let x = lx; x < lx + sw; x++)
      set(x, y, GREEN);

  return pixels;
}

for (const size of [16, 32, 48, 128]) {
  const pixels = drawIcon(size);
  const png = encodePNG(size, size, pixels);
  const out = join(iconsDir, `icon-${size}.png`);
  writeFileSync(out, png);
  console.log(`✓ icons/icon-${size}.png  (${png.length} bytes)`);
}
