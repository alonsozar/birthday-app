/**
 * Generates birthday-cake PNG icons using pure Node.js (no native deps).
 * Draws directly into an RGBA pixel buffer then encodes valid PNG files.
 */
import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'

// ─── PNG encoder ─────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
  const tb = Buffer.from(type, 'ascii')
  const combined = Buffer.concat([tb, data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(combined))
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  return Buffer.concat([len, combined, crc])
}

function encodePNG(size, rgba) {
  // RGBA buffer → PNG with filter type 0 per row
  const sig = Buffer.from([137,80,78,71,13,10,26,10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 6   // colour type: RGBA

  const rows = []
  for (let y = 0; y < size; y++) {
    rows.push(0) // filter byte
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      rows.push(rgba[i], rgba[i+1], rgba[i+2], rgba[i+3])
    }
  }
  const idat = deflateSync(Buffer.from(rows))
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))])
}

// ─── Canvas drawing ───────────────────────────────────────────────────────────

function hex(h) {
  const v = parseInt(h.replace('#',''), 16)
  return [(v>>16)&0xff, (v>>8)&0xff, v&0xff]
}

class Canvas {
  constructor(size) {
    this.size = size
    this.buf = new Uint8Array(size * size * 4) // all transparent
  }

  _put(x, y, r, g, b, a) {
    x = Math.round(x); y = Math.round(y)
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return
    const i = (y * this.size + x) * 4
    // Alpha composite (src over dst)
    const sa = a / 255, da = this.buf[i+3] / 255
    const oa = sa + da * (1 - sa)
    if (oa === 0) return
    this.buf[i]   = Math.round((r * sa + this.buf[i]   * da * (1-sa)) / oa)
    this.buf[i+1] = Math.round((g * sa + this.buf[i+1] * da * (1-sa)) / oa)
    this.buf[i+2] = Math.round((b * sa + this.buf[i+2] * da * (1-sa)) / oa)
    this.buf[i+3] = Math.round(oa * 255)
  }

  fillRect(x, y, w, h, color, alpha = 255) {
    const [r, g, b] = hex(color)
    for (let py = Math.floor(y); py < Math.ceil(y + h); py++)
      for (let px = Math.floor(x); px < Math.ceil(x + w); px++)
        this._put(px, py, r, g, b, alpha)
  }

  fillRoundRect(x, y, w, h, rx, color, alpha = 255) {
    const [r, g, b] = hex(color)
    rx = Math.min(rx, w/2, h/2)
    const x1 = x + rx, x2 = x + w - rx
    const y1 = y + rx, y2 = y + h - rx
    for (let py = Math.floor(y); py <= Math.ceil(y + h); py++) {
      for (let px = Math.floor(x); px <= Math.ceil(x + w); px++) {
        let inside = false
        if (px >= x1 && px <= x2) inside = py >= y && py <= y + h
        else if (py >= y1 && py <= y2) inside = px >= x && px <= x + w
        else {
          const cx = px < x1 ? x1 : x2
          const cy = py < y1 ? y1 : y2
          inside = (px - cx)**2 + (py - cy)**2 <= rx*rx
        }
        if (inside) this._put(px, py, r, g, b, alpha)
      }
    }
  }

  fillEllipse(cx, cy, rx, ry, color, alpha = 255) {
    const [r, g, b] = hex(color)
    for (let py = Math.floor(cy - ry - 1); py <= Math.ceil(cy + ry + 1); py++)
      for (let px = Math.floor(cx - rx - 1); px <= Math.ceil(cx + rx + 1); px++)
        if (((px - cx)/rx)**2 + ((py - cy)/ry)**2 <= 1)
          this._put(px, py, r, g, b, alpha)
  }

  // Draw anti-aliased circle stroke for frosting drip wave
  drawWave(x0, x1, y, amplitude, freq, color, thickness) {
    const [r, g, b] = hex(color)
    const steps = Math.ceil((x1 - x0) * 3)
    for (let i = 0; i <= steps; i++) {
      const px = x0 + (x1 - x0) * i / steps
      const py = y - Math.abs(Math.sin(i / steps * Math.PI * freq)) * amplitude
      // draw thick dot at this point
      for (let dy = -thickness; dy <= thickness; dy++)
        for (let dx = -thickness; dx <= thickness; dx++)
          if (dx*dx + dy*dy <= thickness*thickness)
            this._put(Math.round(px + dx), Math.round(py + dy), r, g, b, 255)
    }
  }

  png() { return encodePNG(this.size, this.buf) }
}

// ─── Birthday Cake Icon ───────────────────────────────────────────────────────
// Design space: 100 × 100 units, scaled by `size / 100`

function drawCakeIcon(size) {
  const c = new Canvas(size)
  const s = v => v * size / 100  // scale helper

  // ── Background: warm brown-orange rounded square ──
  c.fillRoundRect(0, 0, size, size, s(20), '#C2603A')

  // ── Cake tiers (bottom → top) ──
  // Bottom tier — wide, deep gold
  c.fillRoundRect(s(9),  s(61), s(82), s(27), s(5), '#D4A843')
  // Middle tier
  c.fillRoundRect(s(17), s(43), s(66), s(22), s(4), '#E8BD6A')
  // Top tier — smallest
  c.fillRoundRect(s(27), s(28), s(46), s(18), s(4), '#F5D090')

  // ── Frosting drip waves (white) ──
  // On top of bottom tier
  c.drawWave(s(11), s(89), s(61), s(5), 6, '#FFFFFF', s(2.2))
  // On top of middle tier
  c.drawWave(s(19), s(81), s(43), s(4.5), 5, '#FFFFFF', s(1.8))

  // ── Candles ──
  c.fillRoundRect(s(36), s(15), s(9), s(15), s(2), '#E05555')  // left, red
  c.fillRoundRect(s(55), s(15), s(9), s(15), s(2), '#5B9BD5')  // right, blue

  // ── Flames ──
  // Left flame
  c.fillEllipse(s(40.5), s(13), s(5.5), s(7.5), '#FFD93D')
  c.fillEllipse(s(40.5), s(9.5), s(3),   s(4),   '#FF9F43')
  // Right flame
  c.fillEllipse(s(59.5), s(13), s(5.5), s(7.5), '#FFD93D')
  c.fillEllipse(s(59.5), s(9.5), s(3),   s(4),   '#FF9F43')

  // ── Decorative dots on bottom tier ──
  const dotColors = ['#FF6B6B', '#FFFFFF', '#FFD93D', '#FF6B6B', '#FFFFFF', '#FFD93D']
  for (let i = 0; i < 6; i++) {
    c.fillEllipse(s(16 + i * 13.5), s(73.5), s(3.8), s(3.8), dotColors[i])
  }

  return c.png()
}

// ─── Write files ──────────────────────────────────────────────────────────────

try { mkdirSync('public', { recursive: true }) } catch {}

writeFileSync('public/icon-192.png',         drawCakeIcon(192))
writeFileSync('public/icon-512.png',         drawCakeIcon(512))
writeFileSync('public/apple-touch-icon.png', drawCakeIcon(180))

console.log('✓ icon-192.png')
console.log('✓ icon-512.png')
console.log('✓ apple-touch-icon.png')
