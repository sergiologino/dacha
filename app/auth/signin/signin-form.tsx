"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, Loader2, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  extractRussianPhoneDigits,
  formatRussianPhoneMask,
  normalizeRussianPhone,
  sanitizeSmsCode,
} from "@/lib/phone";

const LAST_AUTH_PROVIDER_KEY = "dacha_last_auth_provider";
const SHOW_PHONE_AUTH = process.env.NEXT_PUBLIC_ENABLE_PHONE_AUTH === "1";

export function SignInForm() {
  const searchParams = useSearchParams();
  const [pendingProvider, setPendingProvider] = useState<"google" | "yandex" | null>(null);
  const [lastProvider, setLastProvider] = useState<string | null>(null);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState<string | null>(null);
  const [smsCode, setSmsCode] = useState("");
  const [phoneInfo, setPhoneInfo] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [retryAfterSec, setRetryAfterSec] = useState(0);
  const error = searchParams.get("error");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedProvider = window.localStorage.getItem(LAST_AUTH_PROVIDER_KEY);
    setLastProvider(savedProvider);
    if (error) {
      setPendingProvider(null);
    }
  }, [error]);

  useEffect(() => {
    if (retryAfterSec <= 0) return;

    const timer = window.setInterval(() => {
      setRetryAfterSec((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [retryAfterSec]);

  const errorMessage = useMemo(() => {
    if (!error) return null;

    if (error === "Configuration" && lastProvider === "yandex") {
      return "Не удалось завершить вход через Яндекс. Провайдер вернул недействительный или уже истёкший код авторизации. Попробуйте ещё раз одним нажатием. Если ошибка повторится, временно используйте Google, пока мы проверяем callback Яндекса.";
    }

    if (error === "Configuration") {
      return "Не удалось завершить вход. Попробуйте ещё раз. Если ошибка повторится, используйте другой способ входа.";
    }

    if (error === "AccessDenied") {
      return "Доступ был отменён на стороне провайдера. Если это случайно, попробуйте ещё раз.";
    }

    return "Не удалось выполнить вход. Попробуйте ещё раз чуть позже.";
  }, [error, lastProvider]);

  const phoneValue = useMemo(() => formatRussianPhoneMask(phoneDigits), [phoneDigits]);
  const normalizedPhone = useMemo(() => normalizeRussianPhone(phoneDigits), [phoneDigits]);
  const isPhoneReady = !!normalizedPhone;
  const isPhoneFlowBusy = isSendingCode || isVerifyingCode || !!pendingProvider;

  const startSignIn = async (provider: "google" | "yandex") => {
    if (pendingProvider) return;

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LAST_AUTH_PROVIDER_KEY, provider);
    }

    setPendingProvider(provider);
    await signIn(provider, { callbackUrl: "/garden" });
  };

  const sendPhoneCode = async () => {
    if (!isPhoneReady || isPhoneFlowBusy) return;

    setPhoneError(null);
    setPhoneInfo(null);
    setIsSendingCode(true);

    try {
      const response = await fetch("/api/auth/phone/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: normalizedPhone,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        maskedPhone?: string;
        retryAfterSec?: number;
      };

      if (!response.ok || !data.ok) {
        setPhoneError(data.error || "Не удалось отправить код.");
        setRetryAfterSec(data.retryAfterSec ?? 0);
        return;
      }

      setSubmittedPhone(normalizedPhone);
      setSmsCode("");
      setRetryAfterSec(data.retryAfterSec ?? 60);
      setPhoneInfo(`Код отправлен на ${data.maskedPhone ?? phoneValue}.`);
    } catch {
      setPhoneError("Не удалось отправить код. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyPhoneCode = async () => {
    if (!submittedPhone || smsCode.length !== 6 || isPhoneFlowBusy) return;

    setPhoneError(null);
    setIsVerifyingCode(true);

    try {
      const result = await signIn("phone-otp", {
        phone: submittedPhone,
        code: smsCode,
        redirect: false,
        callbackUrl: "/garden",
      });

      if (!result || result.error) {
        setPhoneError("Неверный код или срок его действия истёк. Запросите новый код и попробуйте ещё раз.");
        return;
      }

      window.location.href = result.url || "/garden";
    } catch {
      setPhoneError("Не удалось завершить вход по номеру телефона. Попробуйте ещё раз.");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-8">
      <div className="flex flex-col items-center mb-8">
        <Sprout className="w-12 h-12 text-emerald-600 mb-4" />
        <h1 className="text-2xl font-bold">Вход в Любимая Дача</h1>
        <p className="text-slate-500 text-sm mt-2">Выберите удобный способ входа</p>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <div className="flex gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-300" />
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Button
          onClick={() => startSignIn("google")}
          variant="outline"
          className="w-full h-12 rounded-2xl text-base"
          disabled={!!pendingProvider}
        >
          {pendingProvider === "google" ? (
            <>
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Переходим в Google...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Войти через Google
            </>
          )}
        </Button>

        <Button
          onClick={() => startSignIn("yandex")}
          variant="outline"
          className="w-full h-12 rounded-2xl text-base"
          disabled={!!pendingProvider}
        >
          {pendingProvider === "yandex" ? (
            <>
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Переходим в Яндекс...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#FC3F1D" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z" />
                <path fill="#FFF" d="M13.63 7.82c-.67 0-1.16.18-1.55.53-.4.35-.66.88-.66 1.62 0 .7.2 1.25.56 1.63.36.37.86.57 1.53.57h.12V7.82zm-4.88 10.06h2.38V14.3h.7l2.04 3.58h2.6l-2.35-3.92c1.42-.55 2.18-1.7 2.18-3.34 0-1.24-.38-2.2-1.13-2.85-.75-.66-1.82-1-3.2-1H8.75v11.1z" />
              </svg>
              Войти через Яндекс
            </>
          )}
        </Button>
      </div>

      {SHOW_PHONE_AUTH && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span>или</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Вход по номеру телефона
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phoneValue}
                onChange={(event) => {
                  setPhoneDigits(extractRussianPhoneDigits(event.target.value));
                  setSubmittedPhone(null);
                  setSmsCode("");
                  setPhoneInfo(null);
                  setPhoneError(null);
                }}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-950"
                placeholder="+7 (___) ___-__-__"
                disabled={isPhoneFlowBusy}
              />
              <p className="text-xs text-slate-500">
                Сейчас поддерживаются номера РФ. Если начать ввод с <code>+7</code> или <code>8</code>, префикс будет отброшен автоматически.
              </p>
            </div>

            <Button
              type="button"
              onClick={sendPhoneCode}
              className="h-12 w-full rounded-2xl text-base"
              disabled={!isPhoneReady || isPhoneFlowBusy}
            >
              {isSendingCode ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Отправляем код...
                </>
              ) : (
                "Получить код по SMS"
              )}
            </Button>

            {submittedPhone && (
              <div className="space-y-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                      Введите код из SMS
                    </p>
                    <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80">
                      {phoneInfo ?? `Код отправлен на ${submittedPhone}.`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedPhone(null);
                      setSmsCode("");
                      setPhoneInfo(null);
                      setPhoneError(null);
                    }}
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-300"
                    disabled={isPhoneFlowBusy}
                  >
                    Изменить
                  </button>
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={smsCode}
                  onChange={(event) => {
                    setSmsCode(sanitizeSmsCode(event.target.value));
                    setPhoneError(null);
                  }}
                  className="h-12 w-full rounded-2xl border border-emerald-200 bg-white px-4 text-center text-lg tracking-[0.35em] outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-900 dark:bg-slate-950"
                  placeholder="000000"
                  disabled={isPhoneFlowBusy}
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={verifyPhoneCode}
                    className="h-12 flex-1 rounded-2xl text-base"
                    disabled={smsCode.length !== 6 || isPhoneFlowBusy}
                  >
                    {isVerifyingCode ? (
                      <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        Проверяем...
                      </>
                    ) : (
                      "Войти"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={sendPhoneCode}
                    className="h-12 rounded-2xl"
                    disabled={retryAfterSec > 0 || isPhoneFlowBusy}
                  >
                    {retryAfterSec > 0 ? `Повторно через ${retryAfterSec}с` : "Отправить ещё раз"}
                  </Button>
                </div>
              </div>
            )}

            {phoneError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                {phoneError}
              </div>
            )}
          </div>
        </>
      )}

      <p className="mt-6 text-center text-xs leading-5 text-slate-500">
        Продолжая, вы соглашаетесь с{" "}
        <Link href="/terms" className="font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
          Условиями использования
        </Link>{" "}
        и{" "}
        <Link href="/privacy" className="font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
          Политикой конфиденциальности
        </Link>
        .
      </p>
    </Card>
  );
}
