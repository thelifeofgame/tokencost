import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'out');

const LOCALE_HTML_LANG = {
  'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant',
  ja: 'ja',
  ko: 'ko',
  es: 'es',
};

if (!fs.existsSync(OUT_DIR)) {
  console.warn('[fix-html-lang] out/ directory does not exist, skipping.');
  process.exit(0);
}

function walkHtmlFiles(dir, acc = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(full, acc);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      acc.push(full);
    }
  }
  return acc;
}

let updatedFiles = 0;

for (const [localeDir, htmlLang] of Object.entries(LOCALE_HTML_LANG)) {
  const dirPath = path.join(OUT_DIR, localeDir);
  if (!fs.existsSync(dirPath)) continue;

  const htmlFiles = walkHtmlFiles(dirPath);
  for (const filePath of htmlFiles) {
    let html = fs.readFileSync(filePath, 'utf8');
    let next = html.replace(/<html\b([^>]*?)\blang="en"/i, `<html$1lang="${htmlLang}"`);
    // Also align Next.js serialized RSC Flight payload so hydration preserves htmlLang
    next = next.replace(
      /(\\"html\\",null,\{\\"lang\\":\\")en(\\")/g,
      `$1${htmlLang}$2`
    );
    if (next !== html) {
      fs.writeFileSync(filePath, next, 'utf8');
      updatedFiles += 1;
    }
  }
}

console.log(`[fix-html-lang] Updated <html lang> in ${updatedFiles} localized HTML files.`);
