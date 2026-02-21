"use client";

import { signIn } from "next-auth/react";
import { Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function SignInForm() {
  return (
    <Card className="w-full max-w-sm p-8">
      <div className="flex flex-col items-center mb-8">
        <Sprout className="w-12 h-12 text-emerald-600 mb-4" />
        <h1 className="text-2xl font-bold">Вход в ДачаAI</h1>
        <p className="text-slate-500 text-sm mt-2">Выберите способ входа</p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={() => signIn("google", { callbackUrl: "/garden" })}
          variant="outline"
          className="w-full h-12 rounded-2xl text-base"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Войти через Google
        </Button>

        <Button
          onClick={() => signIn("yandex", { callbackUrl: "/garden" })}
          variant="outline"
          className="w-full h-12 rounded-2xl text-base"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#FC3F1D" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z" />
            <path fill="#FFF" d="M13.63 7.82c-.67 0-1.16.18-1.55.53-.4.35-.66.88-.66 1.62 0 .7.2 1.25.56 1.63.36.37.86.57 1.53.57h.12V7.82zm-4.88 10.06h2.38V14.3h.7l2.04 3.58h2.6l-2.35-3.92c1.42-.55 2.18-1.7 2.18-3.34 0-1.24-.38-2.2-1.13-2.85-.75-.66-1.82-1-3.2-1H8.75v11.1z" />
          </svg>
          Войти через Яндекс
        </Button>
      </div>
    </Card>
  );
}
