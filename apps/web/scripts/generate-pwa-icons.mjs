/**
 * Gera icon-192.png e icon-512.png a partir de um canvas simples (Node 18+).
 * Uso: node scripts/generate-pwa-icons.mjs
 * Requer: npm i -D sharp  (opcional)
 *
 * Se sharp não estiver instalado, cria placeholders SVG copiados como referência.
 */
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, "../public/icons");
mkdirSync(outDir, { recursive: true });

async function main() {
  try {
    const sharp = (await import("sharp")).default;
    for (const size of [192, 512]) {
      const svg = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
          <rect width="100%" height="100%" rx="${size * 0.18}" fill="#1e3a5f"/>
          <text x="50%" y="54%" text-anchor="middle" font-family="system-ui,sans-serif"
            font-size="${size * 0.32}" font-weight="700" fill="#fbbf24">FT</text>
        </svg>`,
      );
      await sharp(svg).png().toFile(join(outDir, `icon-${size}.png`));
      console.log("wrote", `icon-${size}.png`);
    }
  } catch {
    console.warn(
      "sharp não disponível — use public/icons/icon.svg ou: npm i -D sharp && node scripts/generate-pwa-icons.mjs",
    );
    // Fallback: HTML canvas não existe no node puro sem deps.
    // Copia nota para o dev.
    if (!existsSync(join(outDir, "icon-192.png"))) {
      writeFileSync(
        join(outDir, "README.txt"),
        "Coloque icon-192.png e icon-512.png aqui, ou rode: npm i -D sharp && node scripts/generate-pwa-icons.mjs\n",
      );
    }
  }
}

main();
