import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SVG = readFileSync(join(ROOT, 'public', 'favicon.svg'))
const OUT = join(ROOT, 'public', 'icons')

mkdirSync(OUT, { recursive: true })

const sizes = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

async function main() {
  for (const { name, size } of sizes) {
    await sharp(SVG)
      .resize(size, size)
      .png()
      .toFile(join(OUT, name))
    console.log(`Generated ${name} (${size}x${size})`)
  }
  console.log('Done.')
}

main()
