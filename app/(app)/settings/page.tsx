"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { MapPin, LogOut, Loader2, Save, Crown, CreditCard, Bell, BellOff, Users, BarChart3, BookOpen, CloudSun } from "lucide-react";
import { clearFeatureOnboardingSeen } from "@/components/feature-onboarding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { usePushSubscription } from "@/lib/hooks/use-push-subscription";
import {
  WEATHER_CHECK_INTERVAL_OPTIONS,
  WEATHER_CHECK_INTERVAL_MINUTES_DEFAULT,
} from "@/lib/weather-settings";

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

  useEffect(() => {
    Promise.all([
      fetch("/api/user/location").then((r) => r.json()),
      fetch("/api/user/premium").then((r) => r.json()),
      fetch("/api/user/weather-settings").then((r) => r.json()),
    ])
      .then(([loc, prem, weather]) => {
        if (loc.latitude && loc.longitude) {
          setPosition({ lat: loc.latitude, lng: loc.longitude });
          setLocationName(loc.locationName || "");
        }
        setIsPremium(!!prem.isPremium);
        setIsAdmin(!!prem.isAdmin);
        setWeatherPushEnabled(!!weather.weatherPushEnabled);
        setWeatherCheckIntervalMinutes(
          typeof weather.weatherCheckIntervalMinutes === "number"
            ? weather.weatherCheckIntervalMinutes
            : WEATHER_CHECK_INTERVAL_MINUTES_DEFAULT
        );
        setWeatherHasLocation(!!weather.hasLocation);
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
    setTogglingPremium(true);
    try {
      const res = await fetch("/api/user/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable: !isPremium }),
      });
      const data = await res.json();
      setIsPremium(data.isPremium);
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
                        {p.plan === "yearly" ? "Год" : "Месяц"}
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
                    <th className="text-left py-2 px-2 font-medium">Запросы в нейросеть</th>
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
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Напоминания о работах на сегодня и завтра: и из календаря ухода, и добавленных вами вручную. Работают на телефоне и компьютере.
        </p>
        {(() => {
          const pushLoading = push.state === "loading";
          return (
            <>
              {!push.isSupported ? (
                <p className="text-sm text-slate-500">Ваш браузер не поддерживает push-уведомления.</p>
              ) : push.state === "subscribed" ? (
                <div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-2">Уведомления включены</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={push.unsubscribe}
                    disabled={pushLoading}
                    className="rounded-xl"
                  >
                    {pushLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BellOff className="w-4 h-4 mr-2" />}
                    Отключить
                  </Button>
                </div>
              ) : push.state === "denied" ? (
                <p className="text-sm text-slate-500">Уведомления запрещены в настройках браузера. Разрешите их для этого сайта и нажмите «Включить» снова.</p>
              ) : null}
              {push.isSupported && push.state !== "subscribed" && push.state !== "denied" && (
                <Button
                  onClick={push.subscribe}
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
            </>
          );
        })()}
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <CloudSun className="w-5 h-5 text-emerald-600" />
          Погодные предупреждения
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Пуши при заметных изменениях погоды: заморозки, сильный ветер, дождь, снег и жара. Проверка идёт по вашему местоположению.
        </p>

        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
          <input
            type="checkbox"
            checked={weatherPushEnabled}
            onChange={(e) => setWeatherPushEnabled(e.target.checked)}
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
            onChange={(e) => setWeatherCheckIntervalMinutes(Number(e.target.value))}
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
          onClick={saveWeatherSettings}
          disabled={weatherSaving || !weatherHasLocation}
          className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700"
        >
          {weatherSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CloudSun className="w-4 h-4 mr-2" />}
          Сохранить погодные уведомления
        </Button>

        <p className="text-xs text-slate-400 mt-3">
          Для работы нужны включённые push-уведомления выше и сохранённое местоположение. По умолчанию проверка выполняется раз в час.
        </p>
      </Card>

      <Button
        variant="outline"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full h-12 rounded-2xl text-red-600 border-red-200"
      >
        <LogOut className="w-5 h-5 mr-2" /> Выйти
      </Button>
        </>
      )}
    </>
  );
}
