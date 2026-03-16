import { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "./signin-form";

export const metadata: Metadata = {
  title: "Вход — Любимая Дача",
  description: "Войдите через Google, Яндекс или по номеру телефона, чтобы начать работу с Любимая Дача",
};

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-slate-950 dark:to-amber-950 flex items-center justify-center px-4">
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
