"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOutAndWipeLocalDevice } from "@/lib/auth/client-sign-out";
import { MapPin, LogOut, Loader2, Save, Crown, CreditCard, Bell, BellOff, Users, BarChart3, BookOpen, CloudSun, ListTodo, Send, QrCode, ScanLine, UserMinus } from "lucide-react";
import { clearFeatureOnboardingSeen } from "@/components/feature-onboarding";
import { SubscribeModal } from "@/components/subscribe-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { usePushSubscription } from "@/lib/hooks/use-push-subscription";
import {
  WEATHER_CHECK_INTERVAL_OPTIONS,
  WEATHER_CHECK_INTERVAL_MINUTES_DEFAULT,
} from "@/lib/weather-settings";
import { guardOnlineForFeature } from "@/lib/offline/offline-feature-toast";

type PaymentRow = {
  id: string;
  userEmail: string | null;
  userName: string | null;
  amount: number;
  currency: string;
  status: string;
  plan: string;
  description: string | null;
  createdAt: string;
};

type UserRow = {
  id: string;
  email: string | null;
  name: string | null;
  createdAt: string;
  firstPaymentAt: string | null;
  isPremium: boolean;
  bedsCount: number;
  plantsCount: number;
  aiRequestsCount: number;
};

type PageVisitSummaryItem = {
  path: string;
  totalVisits: number;
  uniqueUsers: number;
  topVisitors: { userEmail: string | null; userName: string | null; visitCount: number; lastVisitedAt: string }[];
};

type FamilyMember = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};

type FamilyStatus = {
  role: "owner" | "member";
  owner: { id: string; name: string | null; email: string | null; phone: string | null } | null;
  members: FamilyMember[];
};

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

const MapComponent = dynamic(
  () => import("../onboarding/map-component"),
  { ssr: false }
);

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [togglingPremium, setTogglingPremium] = useState(false);
  const [tab, setTab] = useState<"profile" | "payments">("profile");
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsTotals, setPaymentsTotals] = useState<{
    totalSucceeded: number;
    totalCanceled: number;
    countSucceeded: number;
    countCanceled: number;
    countPending: number;
  } | null>(null);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [pageVisitsSummary, setPageVisitsSummary] = useState<PageVisitSummaryItem[]>([]);
  const [pageVisitsLoading, setPageVisitsLoading] = useState(false);
  const [weatherPushEnabled, setWeatherPushEnabled] = useState(false);
  const [weatherCheckIntervalMinutes, setWeatherCheckIntervalMinutes] = useState(
    WEATHER_CHECK_INTERVAL_MINUTES_DEFAULT
  );
  const [weatherHasLocation, setWeatherHasLocation] = useState(false);
  const [weatherSaving, setWeatherSaving] = useState(false);
  const [testPushLoading, setTestPushLoading] = useState(false);
  const [testPushMessage, setTestPushMessage] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [familyStatus, setFamilyStatus] = useState<FamilyStatus | null>(null);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteQrDataUrl, setInviteQrDataUrl] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null);
  const [acceptInviteOpen, setAcceptInviteOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [acceptInviteLoading, setAcceptInviteLoading] = useState(false);
  const [scannerMessage, setScannerMessage] = useState<string | null>(null);
  const inviteVideoRef = useRef<HTMLVideoElement | null>(null);
  const acceptInviteHandlerRef = useRef<((code?: string) => void) | null>(null);
  const push = usePushSubscription();

  const fetchUsers = () => {
    if (!isAdmin) return;
    setUsersLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  };

  const fetchPageVisits = () => {
    if (!isAdmin) return;
    setPageVisitsLoading(true);
    fetch("/api/admin/page-visits")
      .then((r) => r.json())
      .then((data) => setPageVisitsSummary(data.summary ?? []))
      .catch(() => setPageVisitsSummary([]))
      .finally(() => setPageVisitsLoading(false));
  };

  const fetchFamilyStatus = () => {
    setFamilyLoading(true);
    fetch("/api/family/status")
      .then((r) => r.json())
      .then((data) => {
        if (data?.role) setFamilyStatus(data as FamilyStatus);
      })
      .catch(() => setFamilyStatus(null))
      .finally(() => setFamilyLoading(false));
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/user/location").then((r) => r.json()),
      fetch("/api/user/premium").then((r) => r.json()),
      fetch("/api/user/weather-settings").then((r) => r.json()),
      fetch("/api/family/status").then((r) => r.json()).catch(() => null),
    ])
      .then(([loc, prem, weather, family]) => {
        if (loc.latitude && loc.longitude) {
          setPosition({ lat: loc.latitude, lng: loc.longitude });
          setLocationName(loc.locationName || "");
        }
        setIsPremium(!!prem.isPremium);
        setHasFullAccess(!!(prem.hasFullAccess ?? prem.isPremium));
        setIsAdmin(!!prem.isAdmin);
        setWeatherPushEnabled(!!weather.weatherPushEnabled);
        setWeatherCheckIntervalMinutes(
          typeof weather.weatherCheckIntervalMinutes === "number"
            ? weather.weatherCheckIntervalMinutes
            : WEATHER_CHECK_INTERVAL_MINUTES_DEFAULT
        );
        setWeatherHasLocation(!!weather.hasLocation);
        if (family?.role) setFamilyStatus(family as FamilyStatus);
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchPayments = () => {
    if (!isAdmin) return;
    setPaymentsLoading(true);
    const params = new URLSearchParams({ dateFrom, dateTo });
    fetch(`/api/admin/payments?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setPayments(data.payments ?? []);
        setPaymentsTotals(data.totals ?? null);
      })
      .catch(() => {
        setPayments([]);
        setPaymentsTotals(null);
      })
      .finally(() => setPaymentsLoading(false));
  };

  useEffect(() => {
    if (tab === "payments" && isAdmin) {
      fetchPayments();
      fetchUsers();
      fetchPageVisits();
    }
  }, [tab, isAdmin, dateFrom, dateTo]);

  const togglePremium = async () => {
    if (!guardOnlineForFeature("Смена статуса Премиум")) return;
    setTogglingPremium(true);
    try {
      const res = await fetch("/api/user/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable: !isPremium }),
      });
      const data = await res.json();
      setIsPremium(data.isPremium);
      setHasFullAccess(data.isPremium);
      toast.success(data.isPremium ? "Премиум включён" : "Премиум отключён");
    } catch {
      toast.error("Ошибка");
    } finally {
      setTogglingPremium(false);
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setPosition({ lat, lng });
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ru`
      );
      const data = await res.json();
      const parts = [];
      if (data.address?.state) parts.push(data.address.state);
      if (data.address?.county) parts.push(data.address.county);
      if (data.address?.city || data.address?.town || data.address?.village)
        parts.push(data.address.city || data.address.town || data.address.village);
      setLocationName(parts.join(", ") || "");
    } catch {
      setLocationName(`${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
    }
  };

  const saveLocation = async () => {
    if (!position) return;
    if (!guardOnlineForFeature("Сохранение местоположения")) return;
    setSaving(true);
    try {
      await fetch("/api/user/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: position.lat,
          longitude: position.lng,
          locationName,
        }),
      });

      await fetch("/api/region/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: position.lat,
          longitude: position.lng,
        }),
      });

      toast.success("Местоположение обновлено");
      setWeatherHasLocation(true);
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const saveWeatherSettings = async () => {
    if (!hasFullAccess) {
      setShowPaywall(true);
      return;
    }
    if (!guardOnlineForFeature("Сохранение настроек погоды")) return;
    setWeatherSaving(true);
    try {
      const res = await fetch("/api/user/weather-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weatherPushEnabled,
          weatherCheckIntervalMinutes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Не удалось сохранить погодные уведомления");
      }

      setWeatherPushEnabled(!!data.weatherPushEnabled);
      setWeatherCheckIntervalMinutes(
        typeof data.weatherCheckIntervalMinutes === "number"
          ? data.weatherCheckIntervalMinutes
          : WEATHER_CHECK_INTERVAL_MINUTES_DEFAULT
      );
      setWeatherHasLocation(!!data.hasLocation);
      toast.success("Погодные уведомления сохранены");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Не удалось сохранить погодные уведомления"
      );
    } finally {
      setWeatherSaving(false);
    }
  };

  const sendTestPush = async () => {
    if (!hasFullAccess) {
      setShowPaywall(true);
      return;
    }
    if (!guardOnlineForFeature("Тестовое push-уведомление")) return;
    setTestPushLoading(true);
    setTestPushMessage(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        sent?: number;
        failed?: number;
        subscriptions?: number;
      };
      if (!res.ok) {
        throw new Error(data.error || "Не удалось отправить тестовое уведомление");
      }
      const message = `Отправлено: ${data.sent ?? 0}, подписок: ${data.subscriptions ?? 0}, ошибок: ${data.failed ?? 0}`;
      setTestPushMessage(message);
      toast.success("Тестовое уведомление отправлено");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось отправить тестовое уведомление";
      setTestPushMessage(message);
      toast.error(message);
    } finally {
      setTestPushLoading(false);
    }
  };

  const createFamilyInvite = async () => {
    setInviteLoading(true);
    try {
      const res = await fetch("/api/family/invite", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        token?: string;
        qrDataUrl?: string;
        expiresAt?: string;
      };
      if (!res.ok || !data.qrDataUrl || !data.token) {
        throw new Error(data.error || "Не удалось создать приглашение");
      }
      setInviteQrDataUrl(data.qrDataUrl);
      setInviteToken(data.token);
      setInviteExpiresAt(data.expiresAt ?? null);
      toast.success("QR-приглашение создано");
      fetchFamilyStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось создать приглашение");
    } finally {
      setInviteLoading(false);
    }
  };

  const acceptFamilyInvite = async (code?: string) => {
    const token = (code ?? inviteCode).trim();
    if (!token) {
      setScannerMessage("Наведите камеру на QR-код или вставьте код вручную.");
      return;
    }
    const ok = window.confirm(
      "После подключения ваши текущие грядки, культуры и фото будут удалены, чтобы не смешивать их с участком владельца. Продолжить?"
    );
    if (!ok) return;
    setAcceptInviteLoading(true);
    try {
      const res = await fetch("/api/family/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Не удалось принять приглашение");
      toast.success("Семейный доступ подключён");
      setAcceptInviteOpen(false);
      setInviteCode("");
      setScannerMessage(null);
      fetchFamilyStatus();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось принять приглашение";
      setScannerMessage(message);
      toast.error(message);
    } finally {
      setAcceptInviteLoading(false);
    }
  };
  acceptInviteHandlerRef.current = (code?: string) => {
    void acceptFamilyInvite(code);
  };

  const removeFamilyMember = async (memberId: string) => {
    if (!window.confirm("Удалить участника из семейного доступа?")) return;
    try {
      const res = await fetch(`/api/family/members/${memberId}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Не удалось удалить участника");
      toast.success("Участник удалён");
      fetchFamilyStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось удалить участника");
    }
  };

  useEffect(() => {
    if (!acceptInviteOpen) return;
    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: number | null = null;

    const start = async () => {
      const barcodeWindow = window as typeof window & {
        BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike;
      };
      if (!barcodeWindow.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) {
        setScannerMessage("Сканер QR недоступен в этом браузере. Введите код вручную.");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        const video = inviteVideoRef.current;
        if (!video || cancelled) return;
        video.srcObject = stream;
        await video.play();
        const detector = new barcodeWindow.BarcodeDetector({ formats: ["qr_code"] });
        const scan = async () => {
          if (cancelled || !inviteVideoRef.current) return;
          try {
            const codes = await detector.detect(inviteVideoRef.current);
            const raw = codes[0]?.rawValue?.trim();
            if (raw) {
              setInviteCode(raw);
              acceptInviteHandlerRef.current?.(raw);
              return;
            }
          } catch {
            // keep scanning
          }
          timer = window.setTimeout(scan, 700);
        };
        void scan();
      } catch {
        setScannerMessage("Не удалось открыть камеру. Разрешите доступ или введите код вручную.");
      }
    };

    void start();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [acceptInviteOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold">Настройки</h1>
        {isAdmin && (
          <div className="flex rounded-2xl border border-slate-200 dark:border-slate-700 p-1 bg-slate-50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={() => setTab("profile")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === "profile"
                  ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Профиль
            </button>
            <button
              type="button"
              onClick={() => setTab("payments")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                tab === "payments"
                  ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <CreditCard className="w-4 h-4" /> Платежи
            </button>
          </div>
        )}
      </div>

      {tab === "payments" && isAdmin ? (
        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-600" />
            Учёт платежей
          </h2>
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-500">С</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-500">По</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchPayments()}
              disabled={paymentsLoading}
              className="rounded-xl"
            >
              {paymentsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Обновить"}
            </Button>
          </div>
          {paymentsTotals && (
            <div className="flex flex-wrap gap-4 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-sm">
              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                Итого оплачено за период: {paymentsTotals.totalSucceeded} ₽
              </span>
              <span className="text-slate-500">
                ({paymentsTotals.countSucceeded} платежей)
              </span>
              {(paymentsTotals.countCanceled > 0 || paymentsTotals.countPending > 0) && (
                <span className="text-slate-500">
                  Отменено: {paymentsTotals.countCanceled}, в ожидании: {paymentsTotals.countPending}
                </span>
              )}
            </div>
          )}
          {paymentsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Платежей пока нет</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-2 font-medium">Дата</th>
                    <th className="text-left py-2 px-2 font-medium">Пользователь</th>
                    <th className="text-left py-2 px-2 font-medium">Сумма</th>
                    <th className="text-left py-2 px-2 font-medium">Тариф</th>
                    <th className="text-left py-2 px-2 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 px-2 text-slate-600 dark:text-slate-400">
                        {new Date(p.createdAt).toLocaleString("ru-RU", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-2 px-2">
                        <span className="font-medium">{p.userName || p.userEmail || "—"}</span>
                        {p.userEmail && (
                          <span className="block text-xs text-slate-500">{p.userEmail}</span>
                        )}
                      </td>
                      <td className="py-2 px-2">{p.amount} ₽</td>
                      <td className="py-2 px-2">
                        {p.plan === "yearly" ? "Год" : p.plan === "seasonal" ? "Сезон" : "Месяц"}
                      </td>
                      <td className="py-2 px-2">
                        <Badge
                          variant={
                            p.status === "succeeded"
                              ? "default"
                              : p.status === "canceled"
                                ? "secondary"
                                : "outline"
                          }
                          className={
                            p.status === "succeeded"
                              ? "bg-emerald-600"
                              : p.status === "canceled"
                                ? "bg-slate-200 dark:bg-slate-700"
                                : ""
                          }
                        >
                          {p.status === "succeeded"
                            ? "Оплачен"
                            : p.status === "canceled"
                              ? "Отменён"
                              : "Ожидание"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2 className="font-semibold mt-8 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Пользователи
          </h2>
          {usersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-slate-500 text-center py-6">Нет пользователей</p>
          ) : (
            <div className="overflow-x-auto -mx-2 mb-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-2 font-medium">E-mail</th>
                    <th className="text-left py-2 px-2 font-medium">Регистрация</th>
                    <th className="text-left py-2 px-2 font-medium">Оплата</th>
                    <th className="text-left py-2 px-2 font-medium">Грядки</th>
                    <th className="text-left py-2 px-2 font-medium">Растения</th>
                    <th className="text-left py-2 px-2 font-medium">Запросы к Агроэксперту</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 px-2">
                        <span className="font-medium">{u.email || "—"}</span>
                        {u.isPremium && (
                          <Badge className="ml-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs">Премиум</Badge>
                        )}
                      </td>
                      <td className="py-2 px-2 text-slate-600 dark:text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString("ru-RU", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-2 px-2 text-slate-600 dark:text-slate-400">
                        {u.firstPaymentAt
                          ? new Date(u.firstPaymentAt).toLocaleDateString("ru-RU", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="py-2 px-2">{u.bedsCount}</td>
                      <td className="py-2 px-2">{u.plantsCount}</td>
                      <td className="py-2 px-2">{u.aiRequestsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2 className="font-semibold mt-8 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            Посещаемость страниц
          </h2>
          {pageVisitsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : pageVisitsSummary.length === 0 ? (
            <p className="text-slate-500 text-center py-6">Данных пока нет. Переходы по страницам учитываются автоматически.</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-2 font-medium">Страница</th>
                    <th className="text-right py-2 px-2 font-medium">Визитов</th>
                    <th className="text-right py-2 px-2 font-medium">Уник. пользователей</th>
                  </tr>
                </thead>
                <tbody>
                  {pageVisitsSummary.map((s) => (
                    <tr key={s.path} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 px-2 font-medium">{s.path}</td>
                      <td className="py-2 px-2 text-right">{s.totalVisits}</td>
                      <td className="py-2 px-2 text-right">{s.uniqueUsers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <>
      {session?.user && (
        <Card className="p-6 mb-6">
          <h2 className="font-semibold mb-3">Профиль</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {session.user.name}
          </p>
          <p className="text-sm text-slate-500">{session.user.email || session.user.phone || "Без email"}</p>
          <div className="mt-3 flex items-center gap-2">
            {isPremium ? (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                <Crown className="w-3 h-3 mr-1" /> Премиум
              </Badge>
            ) : (
              <Badge variant="secondary">Бесплатный</Badge>
            )}
          </div>
        </Card>
      )}

      <Card className="p-6 mb-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          Семейный доступ
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Члены семьи работают с общими грядками и культурами. Удалять посаженные культуры может только владелец аккаунта.
        </p>

        {familyLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          </div>
        ) : familyStatus?.role === "member" ? (
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Вы подключены к семейному участку
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Владелец: {familyStatus.owner?.name || familyStatus.owner?.email || familyStatus.owner?.phone || "аккаунт семьи"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                onClick={() => void createFamilyInvite()}
                disabled={inviteLoading}
                className="h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700"
              >
                {inviteLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <QrCode className="w-4 h-4 mr-2" />}
                Пригласить по QR
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAcceptInviteOpen(true)}
                className="h-11 rounded-2xl"
              >
                <ScanLine className="w-4 h-4 mr-2" />
                Принять приглашение
              </Button>
            </div>

            {inviteQrDataUrl && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={inviteQrDataUrl}
                    alt="QR-код семейного приглашения"
                    className="w-44 h-44 rounded-xl border border-white bg-white p-2"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Покажите этот QR-код члену семьи</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Код действует 7 дней{inviteExpiresAt ? `, до ${new Date(inviteExpiresAt).toLocaleDateString("ru-RU")}` : ""}.
                    </p>
                    {inviteToken && (
                      <p className="mt-2 break-all rounded-xl bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-500">
                        {inviteToken}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {familyStatus?.members?.length ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Участники семьи</p>
                {familyStatus.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {member.name || member.email || member.phone || "Участник семьи"}
                      </p>
                      <p className="truncate text-xs text-slate-500">{member.email || member.phone || member.id}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void removeFamilyMember(member.id)}
                      className="rounded-xl text-red-600 border-red-200 hover:text-red-700"
                    >
                      <UserMinus className="w-4 h-4 mr-1" />
                      Удалить
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="font-semibold mb-2 flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-emerald-600" />
          Очередь синхронизации
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Задачи без интернета (лайки, комментарии, шаринг, аналитика, push) накапливаются здесь и
          уходят на сервер при появлении связи.
        </p>
        <Button variant="outline" className="w-full h-11 rounded-2xl" asChild>
          <Link href="/settings/sync-queue">Открыть очередь</Link>
        </Button>
      </Card>

      {/* Admin: premium toggle */}
      {isAdmin && (
        <Card className="p-6 mb-6 border-amber-200 dark:border-amber-800">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-600" />
            Управление (Админ)
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Текущий статус: {isPremium ? "Премиум" : "Бесплатный"}
          </p>
          <Button
            onClick={togglePremium}
            disabled={togglingPremium}
            variant={isPremium ? "outline" : "default"}
            className={`w-full h-11 rounded-2xl ${!isPremium ? "bg-amber-600 hover:bg-amber-700" : "border-amber-300 text-amber-700"}`}
          >
            {togglingPremium && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isPremium ? "Отключить Премиум" : "Включить Премиум"}
          </Button>
        </Card>
      )}

      <Card className="p-6 mb-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-600" />
          Местоположение участка
        </h2>
        {position && (
          <p className="text-sm text-slate-500 mb-3">
            {locationName || `${position.lat.toFixed(4)}°N, ${position.lng.toFixed(4)}°E`}
          </p>
        )}

        <div
          className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 mb-4"
          style={{ height: 300 }}
        >
          <MapComponent position={position} onMapClick={handleMapClick} />
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Кликните на карте, чтобы изменить местоположение
        </p>

        <Button
          onClick={saveLocation}
          disabled={saving || !position}
          className="w-full h-12 rounded-2xl bg-emerald-600"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          Сохранить местоположение
        </Button>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          Онбординг по приложению
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Краткий обзор основных разделов: участок, грядки, таймлайн, календарь, справочник и чат.
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 rounded-2xl"
          onClick={() => {
            clearFeatureOnboardingSeen();
            router.push("/garden?showOnboarding=1");
          }}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Показать онбординг
        </Button>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Bell className="w-5 h-5 text-emerald-600" />
          Уведомления
          {!hasFullAccess && (
            <Badge variant="outline" className="ml-1 text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700">
              Премиум
            </Badge>
          )}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Напоминания о работах на сегодня и завтра: и из календаря ухода, и добавленных вами вручную. Работают на телефоне и компьютере. Доступно с подпиской Премиум.
        </p>
        {(() => {
          const pushLoading = push.state === "loading";
          const handleEnablePush = () => {
            if (!hasFullAccess) {
              setShowPaywall(true);
              return;
            }
            void push.subscribe();
          };
          return (
            <>
              {!push.isSupported ? (
                <p className="text-sm text-slate-500">Ваш браузер не поддерживает push-уведомления.</p>
              ) : push.state === "subscribed" ? (
                <div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-2">Уведомления включены</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void sendTestPush()}
                      disabled={pushLoading || testPushLoading}
                      className="rounded-xl"
                    >
                      {testPushLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                      Отправить тест
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={push.unsubscribe}
                      disabled={pushLoading || testPushLoading}
                      className="rounded-xl"
                    >
                      {pushLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BellOff className="w-4 h-4 mr-2" />}
                      Отключить
                    </Button>
                  </div>
                </div>
              ) : push.state === "denied" ? (
                <p className="text-sm text-slate-500">Уведомления запрещены в настройках браузера. Разрешите их для этого сайта и нажмите «Включить» снова.</p>
              ) : null}
              {push.isSupported && push.state !== "subscribed" && push.state !== "denied" && (
                <Button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={pushLoading}
                  className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700"
                >
                  {pushLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Bell className="w-5 h-5 mr-2" />}
                  Включить уведомления
                </Button>
              )}
              {push.message && (
                <p className="text-sm text-slate-500 mt-3">{push.message}</p>
              )}
              {testPushMessage && (
                <p className="text-sm text-slate-500 mt-3">{testPushMessage}</p>
              )}
            </>
          );
        })()}
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2 flex-wrap">
          <CloudSun className="w-5 h-5 text-emerald-600" />
          Погодные предупреждения
          {!hasFullAccess && (
            <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700">
              Премиум
            </Badge>
          )}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Пуши при заметных изменениях погоды: заморозки, сильный ветер, дождь, снег и жара. Проверка идёт по вашему местоположению. Доступно с подпиской Премиум.
        </p>

        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
          <input
            type="checkbox"
            checked={weatherPushEnabled}
            onChange={(e) => {
              if (!hasFullAccess) {
                setShowPaywall(true);
                return;
              }
              setWeatherPushEnabled(e.target.checked);
            }}
            disabled={weatherSaving || !weatherHasLocation}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
          />
          <div>
            <p className="text-sm font-medium">Включить погодные предупреждения</p>
            <p className="text-xs text-slate-500 mt-1">
              {weatherHasLocation
                ? "Предупреждения будут приходить только при реальных изменениях погодных рисков."
                : "Сначала сохраните местоположение участка выше на карте."}
            </p>
          </div>
        </label>

        <label className="flex flex-col gap-2 text-sm mb-4">
          <span className="text-slate-500">Интервал проверки погоды</span>
          <select
            value={String(weatherCheckIntervalMinutes)}
            onChange={(e) => {
              if (!hasFullAccess) {
                setShowPaywall(true);
                return;
              }
              setWeatherCheckIntervalMinutes(Number(e.target.value));
            }}
            disabled={weatherSaving || !weatherHasLocation}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm"
          >
            {WEATHER_CHECK_INTERVAL_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes < 60
                  ? `${minutes} мин`
                  : minutes % 60 === 0
                    ? `${minutes / 60} ч`
                    : `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`}
              </option>
            ))}
          </select>
        </label>

        <Button
          type="button"
          onClick={() => {
            if (!hasFullAccess) {
              setShowPaywall(true);
              return;
            }
            void saveWeatherSettings();
          }}
          disabled={weatherSaving || !weatherHasLocation}
          className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700"
        >
          {weatherSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CloudSun className="w-4 h-4 mr-2" />}
          Сохранить погодные уведомления
        </Button>

        <p className="text-xs text-slate-400 mt-3">
          Для работы нужны включённые push-уведомления выше, подписка Премиум и сохранённое местоположение. По умолчанию проверка выполняется раз в час.
        </p>
      </Card>

      <Dialog open={acceptInviteOpen} onOpenChange={setAcceptInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Принять семейное приглашение</DialogTitle>
          <DialogDescription>
            Наведите камеру на QR-код владельца аккаунта или вставьте код вручную.
          </DialogDescription>
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <video
                ref={inviteVideoRef}
                className="h-full w-full object-cover"
                muted
                playsInline
              />
            </div>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-slate-500">Код приглашения</span>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="fam_..."
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm"
              />
            </label>
            {scannerMessage && (
              <p className="text-sm text-slate-500">{scannerMessage}</p>
            )}
            <Button
              type="button"
              onClick={() => void acceptFamilyInvite()}
              disabled={acceptInviteLoading}
              className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700"
            >
              {acceptInviteLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ScanLine className="w-4 h-4 mr-2" />}
              Принять приглашение
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SubscribeModal open={showPaywall} onOpenChange={setShowPaywall} />

      <Button
        variant="outline"
        onClick={() => void signOutAndWipeLocalDevice()}
        className="w-full h-12 rounded-2xl text-red-600 border-red-200"
      >
        <LogOut className="w-5 h-5 mr-2" /> Выйти
      </Button>
        </>
      )}
    </>
  );
}
