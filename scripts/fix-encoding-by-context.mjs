#!/usr/bin/env node
/**
 * Fix mojibake by replacing using context (no need to type broken chars).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, "..", "app", "(app)", "garden", "garden-content.tsx");

let content = fs.readFileSync(filePath, "utf8");

// Replace: toast.success("...")  ->  toast.success("Премиум активирован!")
content = content.replace(/toast\.success\("([^"]*)"\);(\s*\/\/.*\n)?(\s*window\.history\.replaceState)/m, (m, _q, _c, rest) => {
  if (m.includes("╨") || m.includes("╤") || m.includes("╡")) {
    return `toast.success("Премиум активирован!");\n            ${rest.trimStart()}`;
  }
  return m;
});

// Replace: // ╨... (whole comment line)
content = content.replace(/^(\s*\/\/)[^\n]*[╨╤╡][^\n]*\n(\s*useEffect)/m, (m, pre, rest) => {
  return pre + " Проверка оплаты при возврате с ЮKassa: по URL (window), searchParams может быть пуст при гидрации\n" + rest;
});

// Replace: <Sprout ... /> ╨а...
content = content.replace(/(<Sprout className="w-4 h-4" \/>)\s*[^<\n]+\n(\s*<\/h3>)/m, (m, tag, rest) => {
  if (m.includes("╨") || m.includes("╤")) {
    return tag + " Растения без грядки\n" + rest;
  }
  return m;
});

// Replace: title="╨б...
content = content.replace(/(title=")[^"]*("[^>]*>\s*\{uploadingPhoto)/m, (m, pre, suf) => {
  if (m.includes("╨") || m.includes("╤")) {
    return pre + "Сделать фото растения" + suf;
  }
  return m;
});

// Replace: <p ...> ╨Ч╨┤...
content = content.replace(/(<p className="text-sm text-slate-400 mb-4">)\s*[^<]+\s*(<\/p>)/m, (m, open, close) => {
  if (m.includes("╨") || m.includes("╤")) {
    return open + "\n              Здесь пока нет растений\n            " + close;
  }
  return m;
});

// Replace: ╨Я╨╛ ╨║╨░╤В (button text "По категории")
content = content.replace(/(className=\{`px-2 py-1 rounded \$\{addMode === "category"[^`]+`\}\s*>)\s*[^<]+(\s*<\/button>)/m, (m, open, close) => {
  if (m.includes("╨") || m.includes("╤")) {
    return open + "\n                  По категории\n                " + close;
  }
  return m;
});

// Replace: placeholder="╨Т╨▓...
content = content.replace(/(placeholder=")[^"]*("[\s\S]*?value=\{selectedHit)/m, (m, pre, suf) => {
  if (m.includes("╨") || m.includes("╤")) {
    return pre + "Введите 3+ буквы (название или сорт)" + suf;
  }
  return m;
});

// Replace: <option value="">╨Ъ╨░╤В╨╡╨│...
content = content.replace(/(<option value="">)[^<]+(<\/option>\s*\{categories\.map)/m, (m, open, rest) => {
  if (m.includes("╨") || m.includes("╤")) {
    return open + "Категория" + rest;
  }
  return m;
});

// Replace: <option value="">╨Ъ╤Г╨╗╤М...
content = content.replace(/(<option value="">)[^<]+(<\/option>\s*\{categoryCrops)/m, (m, open, rest) => {
  if (m.includes("╨") || m.includes("╤")) {
    return open + "Культура" + rest;
  }
  return m;
});

// Replace: <option value="">╨б╨╛╤Р╤В...
content = content.replace(/(<option value="">)[^<]+(<\/option>\s*\{varieties\.map)/m, (m, open, rest) => {
  if (m.includes("╨") || m.includes("╤")) {
    return open + "Сорт (необязательно)" + rest;
  }
  return m;
});

// Replace: {/* ╨У╨░╨╗...
content = content.replace(/(\{\s*\/\*\s*)[^*]*[╨╤╡][^*]*(\s*\*\/\s*\}\s*\n\s*<Dialog)/m, (m, open, rest) => {
  return open + "Галерея фото растения — полноэкранная на мобильном */}\n    " + rest;
});

// Replace: aria-label="╨Ч╨░╨║...
content = content.replace(/(aria-label=")[^"]*("[\s\S]*?onClick=\{closeGallery\})/m, (m, pre, suf) => {
  if (m.includes("╨") || m.includes("╤")) {
    return pre + "Закрыть" + suf;
  }
  return m;
});

fs.writeFileSync(filePath, content);
console.log("Encoding fixes applied.");
console.log("Checking for remaining mojibake...");
const hasMojibake = /[╨╤╡]/.test(content);
if (hasMojibake) {
  console.log("WARNING: Some mojibake may remain. Search for ╨ or ╤ in the file.");
} else {
  console.log("No mojibake characters found. Done.");
}
