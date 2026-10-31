// Uses the supplied official logo unchanged, apart from resizing/padding.
// sharp is installed with Next.js for image optimization.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'public/klevro/brand/klevro-logo.jpg');
const output = path.join(root, 'public/pwa');

const png = size => sharp(source).rotate().resize(size, size, { fit: 'contain', background: '#fff' }).flatten({ background: '#fff' }).png({ compressionLevel: 9 }).toBuffer();

async function main() {
  await fs.mkdir(output, { recursive: true });
  for (const [size, name] of [[192, 'klevro-v2-192.png'], [512, 'klevro-v2-512.png'], [180, 'klevro-v2-apple-180.png']]) {
    await fs.writeFile(path.join(output, name), await png(size));
  }
  // Keep the complete K and wordmark inside the maskable icon's safe circle.
  const padded = await sharp(source).rotate().resize(358, 358).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 3, background: '#fff' } })
    .composite([{ input: padded, left: 77, top: 77 }]).flatten({ background: '#fff' }).png({ compressionLevel: 9 })
    .toFile(path.join(output, 'klevro-v2-maskable-512.png'));

  // Modern ICO container with PNG entries for desktop/taskbar and browser tabs.
  const sizes = [32, 48, 256];
  // ICO decoders (including Next's metadata loader) require RGBA PNG entries.
  const entries = await Promise.all(sizes.map(async size => sharp(await png(size)).ensureAlpha().png().toBuffer()));
  const header = Buffer.alloc(6 + sizes.length * 16);
  header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  entries.forEach((entry, index) => {
    const at = 6 + index * 16;
    header[at] = sizes[index] % 256; header[at + 1] = sizes[index] % 256;
    header.writeUInt16LE(1, at + 4); header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(entry.length, at + 8); header.writeUInt32LE(offset, at + 12);
    offset += entry.length;
  });
  const ico = Buffer.concat([header, ...entries]);
  await fs.writeFile(path.join(output, 'klevro-v2.ico'), ico);
  await fs.writeFile(path.join(root, 'src/app/favicon.ico'), ico);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
