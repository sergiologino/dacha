#!/usr/bin/env node
/** Fix remaining mojibake in garden bed form (button + form labels). */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, "..", "app", "(app)", "garden", "garden-content.tsx");

let content = fs.readFileSync(filePath, "utf8");

// Replace by unique ASCII context to avoid encoding mismatch
const fixes = [
  ["><Plus className=\"w-4 h-4 mr-1\" /> ", "><Plus className=\"w-4 h-4 mr-1\" /> Новая грядка\n          "],
  ["<h3 className=\"font-semibold mb-3\">", "Новая грядка</h3>\n            <div className=\"flex flex-col gap-3\">\n              <input\n                type=\"text\"\n                placeholder=\"Название (Томатная теплица)\"\n                value={newBedName}\n                onChange={(e) => setNewBedName(e.target.value)}\n                className=\"w-full px-4 py-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900\"\n              />\n              <div className=\"flex gap-2\">\n                <input\n                  type=\"text\"\n                  placeholder=\"", "Номер"],
];

// Simpler: replace the broken substrings that appear in the file
// Read the file and get the exact byte sequence for the broken text, then replace with correct Russian
// Line-by-line replacement (array index = line number - 1)
const lines = content.split("\n");
if (lines[177].includes("Plus") && lines[177].includes("╨")) {
  lines[177] = "            <Plus className=\"w-4 h-4 mr-1\" /> Новая грядка";
}
if (lines[186].includes("font-semibold") && lines[186].includes("╨")) {
  lines[186] = "            <h3 className=\"font-semibold mb-3\">Новая грядка</h3>";
}
if (lines[198].includes("placeholder") && lines[198].includes("╨")) {
  lines[198] = "                  placeholder=\"Номер\"";
}
if (lines[208].includes("open") && lines[208].includes("ЁЯ")) {
  lines[208] = "                  <option value=\"open\">🌿 Открытый грунт</option>";
}
if (lines[210].includes("raised") && lines[210].includes("ЁЯ")) {
  lines[210] = "                  <option value=\"raised\">📦 Высокая грядка</option>";
}

content = lines.join("\n");
fs.writeFileSync(filePath, content);
console.log("Fixed bed form encoding in garden-content.tsx");
