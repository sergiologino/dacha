"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
          Что-то пошло не так
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
          Произошла ошибка при загрузке. Попробуйте обновить страницу или зайти позже.
        </p>
        <Button
          onClick={reset}
          className="rounded-2xl bg-emerald-600 hover:bg-emerald-700"
        >
          Обновить страницу
        </Button>
      </div>
    </div>
  );
}
