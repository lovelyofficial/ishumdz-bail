/**
 * make-banner.mjs — generates media/ping-banner.jpg for the .ping demo
 * Run: node examples/make-banner.mjs
 */
import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('media', { recursive: true })

const W = 640, H = 200

// WhatsApp-dark themed banner: gradient bg + green accents + emoji-free text (font-safe)
const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a1a12"/>
      <stop offset="100%" stop-color="#0d2b1c"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${W}" height="6" fill="#25D366"/>
  <rect x="0" y="${H - 6}" width="${W}" height="6" fill="#25D366"/>
  <circle cx="70" cy="86" r="34" fill="#25D366" opacity="0.15"/>
  <circle cx="70" cy="86" r="34" fill="none" stroke="#25D366" stroke-width="2" opacity="0.7"/>
  <path d="M58 88 l10 10 l18 -20" stroke="#25D366" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="124" y="76" font-family="DejaVu Sans, sans-serif" font-size="34" font-weight="bold" fill="#ffffff">ISHAN-X MD PRO</text>
  <text x="124" y="112" font-family="DejaVu Sans, sans-serif" font-size="16" fill="#25D366">SPEED • STABILITY • POWER</text>
  <text x="124" y="146" font-family="DejaVu Sans, sans-serif" font-size="13" fill="#88aa99">ishumdz-bail • whatsapp bot library</text>
</svg>`

await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toFile('media/ping-banner.jpg')
console.log('✅ media/ping-banner.jpg created (with text)')
