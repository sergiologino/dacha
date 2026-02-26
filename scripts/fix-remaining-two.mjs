#!/usr/bin/env node
import fs from "fs";
const path = "E:/1_MyProjects/GROK/dacha-ai/app/(app)/garden/garden-content.tsx";
let c = fs.readFileSync(path, "utf8");
const p = 'placeholder="';
const a = 'aria-label="';
let i = c.indexOf(p);
while (i !== -1) {
  const j = c.indexOf('"', i + p.length);
  const sub = c.substring(i + p.length, j);
  if (sub.includes("\u2568") || sub.includes("\u2564")) {
    c = c.slice(0, i + p.length) + "Введите 3+ буквы (название или сорт)" + c.slice(j);
    break;
  }
  i = c.indexOf(p, j);
}
let k = c.indexOf(a);
while (k !== -1) {
  const l = c.indexOf('"', k + a.length);
  const sub = c.substring(k + a.length, l);
  if (sub.includes("\u2568") || sub.includes("\u2564")) {
    c = c.slice(0, k + a.length) + "Закрыть" + c.slice(l);
    break;
  }
  k = c.indexOf(a, l);
}
fs.writeFileSync(path, c);
console.log("Done");
