import { readFile } from "fs/promises";
import path from "path";
import Link from "next/link";
import { simpleMarkdownToHtml } from "@/lib/simple-markdown";

interface LegalDocumentProps {
  fileName: string;
}

export async function LegalDocument({ fileName }: LegalDocumentProps) {
  const filePath = path.join(process.cwd(), fileName);
  const markdown = await readFile(filePath, "utf8");

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-4 py-10 dark:from-emerald-950 dark:via-slate-950 dark:to-amber-950">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/70 bg-white/95 p-6 shadow-xl shadow-emerald-900/5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 dark:shadow-black/20 sm:p-10">
        <div className="mb-6">
          <Link
            href="/auth/signin"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            ← Вернуться ко входу
          </Link>
        </div>

        <div
          className="prose prose-slate max-w-none dark:prose-invert prose-a:no-underline"
          dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(markdown) }}
        />
      </div>
    </div>
  );
}
