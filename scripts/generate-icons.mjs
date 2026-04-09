import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';

const CRC_TABLE = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  const combined = Buffer.concat([tb, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(combined));
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  return Buffer.concat([lenBuf, combined, crcBuf]);
}

function createPNG(size, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;

  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    row[0] = 0;
    for (let x = 0; x < size; x++) {
      // Rounded corners mask
      const cx = x - size / 2, cy = y - size / 2, rad = size * 0.42;
      const corner = size * 0.18;
      let inside = true;
      if (Math.abs(cx) > rad || Math.abs(cy) > rad) inside = false;
      if (Math.abs(cx) > rad - corner && Math.abs(cy) > rad - corner) {
        const dx = Math.abs(cx) - (rad - corner), dy = Math.abs(cy) - (rad - corner);
        if (Math.sqrt(dx*dx + dy*dy) > corner) inside = false;
      }
      const i = 1 + x * 3;
      if (inside) {
        row[i] = r; row[i+1] = g; row[i+2] = b;
      } else {
        row[i] = 255; row[i+1] = 247; row[i+2] = 240; // --cream background
      }
    }
    rows.push(row);
  }

  const idat = deflateSync(Buffer.concat(rows));
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))]);
}

// Brand color: #C2603A (194, 96, 58)
const R = 194, G = 96, B = 58;

try { mkdirSync('public', { recursive: true }); } catch {}

writeFileSync('public/icon-192.png', createPNG(192, R, G, B));
writeFileSync('public/icon-512.png', createPNG(512, R, G, B));
writeFileSync('public/apple-touch-icon.png', createPNG(180, R, G, B));
console.log('Icons generated successfully.');
