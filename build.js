/**
 * build.js — Pipeline de build para producción
 * Dra. Bania Abrego | Odontología Integral
 *
 * Genera /dist con:
 *  ✓ CSS concatenado y minificado  → css/style.min.css
 *  ✓ JS minificado                 → js/main.min.js
 *  ✓ HTML minificado               → index.html
 *  ✓ Logo en WebP + tamaños srcset → assets/logo/
 *  ✓ Reporte de tamaños y ahorros
 */

'use strict';

const fs      = require('fs');
const path    = require('path');

const CleanCSS    = require('clean-css');
const { minify: minifyJS } = require('terser');
const { minify: minifyHTML } = require('html-minifier-terser');
const sharp   = require('sharp');

/* ─── Rutas ─── */
const SRC  = path.resolve(__dirname);
const DIST = path.resolve(__dirname, 'dist');

/* ─── Colores en terminal ─── */
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  cyan:   '\x1b[36m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m',
  purple: '\x1b[35m',
};

function log(icon, label, msg, color = c.reset) {
  console.log(`${color}${c.bold}${icon}${c.reset} ${c.gray}${label.padEnd(18)}${c.reset} ${color}${msg}${c.reset}`);
}

function size(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function saving(before, after) {
  const pct = (((before - after) / before) * 100).toFixed(1);
  return `${size(before)} → ${c.green}${size(after)}${c.reset} ${c.gray}(−${pct}%)${c.reset}`;
}

/* ─── Crear directorios ─── */
function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/* ─── Leer archivo ─── */
function read(file) {
  return fs.readFileSync(file, 'utf8');
}

/* ─── Escribir archivo ─── */
function write(file, content) {
  mkdirp(path.dirname(file));
  if (typeof content === 'string') {
    fs.writeFileSync(file, content, 'utf8');
  } else {
    fs.writeFileSync(file, content);
  }
}

/* ══════════════════════════════════════════════════════════
   PASO 1 — Limpiar /dist
══════════════════════════════════════════════════════════ */
function cleanDist() {
  log('🧹', 'Clean', `Limpiando ${DIST}`, c.yellow);
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
  }
  mkdirp(DIST);
}

/* ══════════════════════════════════════════════════════════
   PASO 2 — CSS: concatenar y minificar
══════════════════════════════════════════════════════════ */
async function buildCSS() {
  const cssFiles = [
    path.join(SRC, 'css', 'base.css'),
    path.join(SRC, 'css', 'layout.css'),
    path.join(SRC, 'css', 'components.css'),
    path.join(SRC, 'css', 'utilities.css'),
  ];

  const source = cssFiles.map(f => read(f)).join('\n\n');
  const before = Buffer.byteLength(source, 'utf8');

  const result = new CleanCSS({
    level: { 1: { all: true }, 2: { all: true } },
    sourceMap: false,
  }).minify(source);

  if (result.errors.length) throw new Error('CSS errors: ' + result.errors.join(', '));

  const outPath = path.join(DIST, 'css', 'style.min.css');
  write(outPath, result.styles);

  const after = Buffer.byteLength(result.styles, 'utf8');
  log('🎨', 'CSS', saving(before, after), c.cyan);
  return result.styles;
}

/* ══════════════════════════════════════════════════════════
   PASO 3 — JS: minificar
══════════════════════════════════════════════════════════ */
async function buildJS() {
  const src    = read(path.join(SRC, 'js', 'main.js'));
  const before = Buffer.byteLength(src, 'utf8');

  const result = await minifyJS(src, {
    compress: {
      dead_code: true,
      drop_console: false,
      passes: 2,
    },
    mangle: true,
    format: { comments: false },
  });

  if (!result.code) throw new Error('JS minification failed');

  const outPath = path.join(DIST, 'js', 'main.min.js');
  write(outPath, result.code);

  const after = Buffer.byteLength(result.code, 'utf8');
  log('⚡', 'JavaScript', saving(before, after), c.yellow);
}

/* ══════════════════════════════════════════════════════════
   PASO 4 — Imágenes: WebP + srcset
══════════════════════════════════════════════════════════ */
async function buildImages() {
  const logoSrc = path.join(SRC, 'assets', 'logo', 'logo.jpg');
  const logoDir = path.join(DIST, 'assets', 'logo');
  mkdirp(logoDir);

  const sharpImg = sharp(logoSrc);
  const meta     = await sharpImg.metadata();

  /* logo original (optimizado) */
  await sharpImg
    .jpeg({ quality: 85, progressive: true, mozjpeg: true })
    .toFile(path.join(logoDir, 'logo.jpg'));

  /* WebP — tamaño completo */
  await sharp(logoSrc)
    .webp({ quality: 82, effort: 6 })
    .toFile(path.join(logoDir, 'logo.webp'));

  /* WebP — 2× para Retina */
  await sharp(logoSrc)
    .resize(Math.round(meta.width * 1.5))
    .webp({ quality: 80, effort: 6 })
    .toFile(path.join(logoDir, 'logo@2x.webp'));

  /* WebP — thumbnail (header, 130px aprox) */
  await sharp(logoSrc)
    .resize(260)
    .webp({ quality: 80, effort: 6 })
    .toFile(path.join(logoDir, 'logo-sm.webp'));

  const origSize  = fs.statSync(logoSrc).size;
  const webpSize  = fs.statSync(path.join(logoDir, 'logo.webp')).size;
  log('🖼 ', 'Imágenes', `logo.jpg ${saving(origSize, webpSize)} (WebP + srcset)`, c.green);
}

/* ══════════════════════════════════════════════════════════
   PASO 5 — HTML: actualizar refs + minificar
══════════════════════════════════════════════════════════ */
async function buildHTML() {
  let html   = read(path.join(SRC, 'index.html'));
  const before = Buffer.byteLength(html, 'utf8');

  /* Reemplazar 4 <link> de CSS → 1 minificado */
  html = html.replace(
    /<!--\s*═+\s*Hojas de estilo modulares[\s\S]*?═+\s*-->\s*([\s\S]*?)(?=\n\s*<!--)/,
    (match) => {
      return `  <!-- CSS minificado -->\n  <link rel="stylesheet" href="css/style.min.css">`;
    }
  );

  /* Fallback más robusto si el comentario no matchea */
  html = html
    .replace(/<link rel="stylesheet" href="css\/base\.css">\s*/g, '')
    .replace(/<link rel="stylesheet" href="css\/layout\.css">\s*/g, '')
    .replace(/<link rel="stylesheet" href="css\/components\.css">\s*/g, '')
    .replace(/<link rel="stylesheet" href="css\/utilities\.css">/g,
             '<link rel="stylesheet" href="css/style.min.css">');

  /* Reemplazar script JS */
  html = html.replace(
    /<script src="js\/main\.js" defer><\/script>/,
    '<script src="js/main.min.js" defer></script>'
  );

  /* Actualizar logo.jpg → <picture> con WebP */
  const pictureTag = `<picture>
          <source srcset="assets/logo/logo-sm.webp 130w, assets/logo/logo.webp 260w, assets/logo/logo@2x.webp 390w" sizes="130px" type="image/webp">
          <img`;

  /* Logo en el header nav */
  html = html.replace(
    /(<a href="#inicio" class="nav__logo"[^>]*>)\s*<img(\s[^>]*src="assets\/logo\/logo\.jpg"[^>]*)>/,
    (_, anchor, attrs) =>
      `${anchor}\n        <picture>\n          <source srcset="assets/logo/logo-sm.webp 130w, assets/logo/logo.webp 260w" sizes="130px" type="image/webp">\n          <img${attrs}>\n        </picture>`
  );

  /* Logo en el footer */
  html = html.replace(
    /(class="footer__logo">\s*)<img(\s[^>]*src="assets\/logo\/logo\.jpg"[^>]*)>/,
    (_, before, attrs) =>
      `${before}<picture>\n          <source srcset="assets/logo/logo-sm.webp 130w, assets/logo/logo.webp 260w" sizes="120px" type="image/webp">\n          <img${attrs}>\n        </picture>`
  );

  /* Minificar HTML */
  const minified = await minifyHTML(html, {
    collapseWhitespace:    true,
    removeComments:        true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    minifyCSS:             true,   /* CSS crítico inline */
    minifyJS:              false,
    useShortDoctype:       true,
    sortAttributes:        true,
  });

  write(path.join(DIST, 'index.html'), minified);

  const after = Buffer.byteLength(minified, 'utf8');
  log('📄', 'HTML', saving(before, after), c.purple);
}

/* ══════════════════════════════════════════════════════════
   PASO 6 — Reporte final
══════════════════════════════════════════════════════════ */
function report() {
  function dirSize(dir) {
    let total = 0;
    for (const f of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
      if (f.isFile && f.isFile()) {
        const full = path.join(f.parentPath || f.path || dir, f.name);
        try { total += fs.statSync(full).size; } catch {}
      }
    }
    return total;
  }

  const distSize = dirSize(DIST);
  const files    = fs.readdirSync(DIST, { recursive: true, withFileTypes: true })
    .filter(f => f.isFile && f.isFile())
    .map(f => {
      const full = path.join(f.parentPath || f.path || DIST, f.name);
      const rel  = path.relative(DIST, full);
      const s    = fs.statSync(full).size;
      return `  ${c.gray}dist/${rel.padEnd(40)}${c.reset}${size(s)}`;
    }).join('\n');

  console.log('\n' + '─'.repeat(56));
  console.log(files);
  console.log('─'.repeat(56));
  console.log(`${c.bold}${c.green}  Total dist: ${size(distSize)}${c.reset}\n`);
}

/* ══════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════ */
async function main() {
  console.log(`\n${c.bold}${c.purple}╔══════════════════════════════════════════════╗
║  Build — Dra. Bania Abrego   Dental Web     ║
╚══════════════════════════════════════════════╝${c.reset}\n`);

  const t0 = Date.now();

  try {
    cleanDist();
    await buildCSS();
    await buildJS();
    await buildImages();
    await buildHTML();

    const ms = Date.now() - t0;
    console.log(`\n${c.bold}${c.green}✓ Build completado en ${ms}ms${c.reset}`);
    report();
  } catch (err) {
    console.error(`\n${c.red}${c.bold}✗ Error en el build:${c.reset}`, err.message);
    process.exit(1);
  }
}

main();
