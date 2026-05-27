/**
 * Generate minimal PNG icon files for the Chrome extension.
 * Creates solid green shield-colored squares in 16, 32, 48, and 128px sizes.
 * Uses pure Node.js — no external dependencies.
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { deflateSync } from 'zlib';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, '..', 'public', 'icons');

if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

/**
 * Create a minimal valid PNG file with a rounded-rect shield shape.
 * @param {number} size - Width and height in pixels
 * @returns {Buffer} PNG file contents
 */
function createPNG(size) {
  // Shield gradient colors (green)
  const colorTop = { r: 34, g: 197, b: 94 };    // #22C55E
  const colorBot = { r: 22, g: 163, b: 74 };     // #16A34A
  const white = { r: 255, g: 255, b: 255 };

  // Create raw RGBA pixel data
  const rawRows = [];
  const pad = Math.max(1, Math.floor(size * 0.12));  // padding around shield
  const radius = Math.floor(size * 0.22);              // corner radius

  for (let y = 0; y < size; y++) {
    const row = [0]; // filter byte (None)
    const t = y / (size - 1); // 0..1 vertical position

    for (let x = 0; x < size; x++) {
      // Check if pixel is inside the rounded rectangle (shield body)
      const inShield = isInRoundedRect(x, y, pad, pad, size - pad * 2, size - pad * 2, radius);

      // Check if pixel is part of the checkmark
      const inCheck = isInCheckmark(x, y, size);

      if (inShield) {
        if (inCheck) {
          row.push(white.r, white.g, white.b, 255);
        } else {
          // Gradient from top to bottom
          const r = Math.round(colorTop.r + (colorBot.r - colorTop.r) * t);
          const g = Math.round(colorTop.g + (colorBot.g - colorTop.g) * t);
          const b = Math.round(colorTop.b + (colorBot.b - colorTop.b) * t);
          row.push(r, g, b, 255);
        }
      } else {
        row.push(0, 0, 0, 0); // transparent
      }
    }
    rawRows.push(Buffer.from(row));
  }

  const rawData = Buffer.concat(rawRows);
  const compressed = deflateSync(rawData);

  // Build PNG file
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);   // width
  ihdr.writeUInt32BE(size, 4);   // height
  ihdr.writeUInt8(8, 8);         // bit depth
  ihdr.writeUInt8(6, 9);         // color type (RGBA)
  ihdr.writeUInt8(0, 10);        // compression
  ihdr.writeUInt8(0, 11);        // filter
  ihdr.writeUInt8(0, 12);        // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Build a PNG chunk: length(4) + type(4) + data + crc(4)
 */
function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData) >>> 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

/**
 * CRC32 calculation for PNG chunks
 */
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = c ^ buf[i];
    for (let j = 0; j < 8; j++) {
      if (c & 1) {
        c = (c >>> 1) ^ 0xEDB88320;
      } else {
        c = c >>> 1;
      }
    }
  }
  return c ^ 0xFFFFFFFF;
}

/**
 * Check if (x, y) is inside a rounded rectangle
 */
function isInRoundedRect(px, py, rx, ry, rw, rh, radius) {
  if (px < rx || px >= rx + rw || py < ry || py >= ry + rh) return false;

  // Check corners
  const corners = [
    { cx: rx + radius, cy: ry + radius },             // top-left
    { cx: rx + rw - radius, cy: ry + radius },         // top-right
    { cx: rx + radius, cy: ry + rh - radius },         // bottom-left
    { cx: rx + rw - radius, cy: ry + rh - radius },    // bottom-right
  ];

  for (const corner of corners) {
    const inCornerRegion =
      (px < corner.cx && corner.cx === rx + radius || px >= corner.cx && corner.cx === rx + rw - radius) &&
      (py < corner.cy && corner.cy === ry + radius || py >= corner.cy && corner.cy === ry + rh - radius);

    if (inCornerRegion) {
      const dx = px - corner.cx;
      const dy = py - corner.cy;
      if (dx * dx + dy * dy > radius * radius) return false;
    }
  }

  return true;
}

/**
 * Check if (x, y) is part of a simple checkmark shape
 */
function isInCheckmark(px, py, size) {
  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 128;
  const thickness = Math.max(2, Math.round(8 * scale));

  // Checkmark has two line segments:
  // Left part: from (-20, 0) to (-5, 15) relative to center
  // Right part: from (-5, 15) to (25, -20) relative to center

  const rx = px - cx;
  const ry = py - cy;

  // Left segment
  const lx1 = -20 * scale, ly1 = 0 * scale;
  const lx2 = -5 * scale,  ly2 = 15 * scale;
  if (distToSegment(rx, ry, lx1, ly1, lx2, ly2) < thickness) return true;

  // Right segment
  const rx1 = -5 * scale,  ry1 = 15 * scale;
  const rx2 = 25 * scale,  ry2 = -20 * scale;
  if (distToSegment(rx, ry, rx1, ry1, rx2, ry2) < thickness) return true;

  return false;
}

/**
 * Distance from point (px, py) to line segment (x1,y1)-(x2,y2)
 */
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// Generate all sizes
const sizes = [16, 32, 48, 128];
for (const size of sizes) {
  const png = createPNG(size);
  const path = resolve(iconsDir, `icon-${size}.png`);
  writeFileSync(path, png);
  console.log(`✅ Created ${path} (${png.length} bytes)`);
}

console.log('\nDone! Icons generated.');
