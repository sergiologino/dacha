function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function applyInlineMarkdown(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-emerald-700 underline underline-offset-4 dark:text-emerald-400">$1</a>');
}

export function simpleMarkdownToHtml(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const blocks: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(`<ul class="my-4 list-disc space-y-2 pl-6">${listItems.join("")}</ul>`);
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    if (line.startsWith("# ")) {
      flushList();
      blocks.push(`<h1 class="mt-8 text-3xl font-bold text-slate-900 dark:text-white">${applyInlineMarkdown(line.slice(2))}</h1>`);
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      blocks.push(`<h2 class="mt-8 text-2xl font-semibold text-slate-900 dark:text-white">${applyInlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      blocks.push(`<h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-white">${applyInlineMarkdown(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith("- ")) {
      listItems.push(`<li>${applyInlineMarkdown(line.slice(2))}</li>`);
      continue;
    }

    flushList();
    blocks.push(`<p class="my-4 leading-7 text-slate-700 dark:text-slate-300">${applyInlineMarkdown(line)}</p>`);
  }

  flushList();
  return blocks.join("\n");
}
