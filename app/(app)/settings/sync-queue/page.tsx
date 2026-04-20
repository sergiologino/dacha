"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, Trash2, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteOutboxRecord, listOutboxTasksForDisplay } from "@/lib/offline/outbox";
import { OUTBOX_CHANGED_EVENT } from "@/lib/offline/sync-events";
import {
  outboxActionDescription,
  outboxStatusLabel,
} from "@/lib/offline/outbox-action-label";
import type { OutboxRecord } from "@/lib/offline/outbox-types";
import { toast } from "sonner";

type AdminTaskRow = {
  id: string;
  clientLocalId: string | null;
  userId: string;
  userEmail: string | null;
  userPhone: string | null;
  action: string;
  payload: unknown;
  status: string;
  errorMsg: string | null;
  createdAt: string;
};

export default function SyncQueueSettingsPage() {
  const { status: sessionStatus } = useSession();
  const [rows, setRows] = useState<OutboxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminRows, setAdminRows] = useState<AdminTaskRow[] | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  const refreshLocal = useCallback(async () => {
    setRows(await listOutboxTasksForDisplay());
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshLocal();
    const onChange = () => void refreshLocal();
    window.addEventListener(OUTBOX_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(OUTBOX_CHANGED_EVENT, onChange);
  }, [refreshLocal]);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    setAdminLoading(true);
    fetch("/api/admin/outbox-tasks")
      .then(async (r) => {
        if (!r.ok) {
          setAdminRows(null);
          return;
        }
        const data = (await r.json()) as { tasks?: AdminTaskRow[] };
        setAdminRows(data.tasks ?? []);
      })
      .catch(() => setAdminRows(null))
      .finally(() => setAdminLoading(false));
  }, [sessionStatus]);

  const removeOne = async (id: string) => {
    try {
      await deleteOutboxRecord(id);
      toast.success("Задача удалена из очереди");
    } catch {
      toast.error("Не удалось удалить");
    }
  };

  if (sessionStatus === "loading") {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (sessionStatus !== "authenticated") {
    return (
      <p className="text-center text-slate-600 py-12">
        Войдите, чтобы видеть очередь синхронизации.
      </p>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <Button variant="ghost" asChild className="mb-2 -ml-2">
        <Link href="/settings">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад в профиль
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Очередь синхронизации</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Задачи, которые отправятся на сервер при появлении стабильной связи. Ненужные можно
          удалить.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-slate-600">На этом устройстве очередь пуста.</Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Card className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium text-sm">{outboxActionDescription(r)}</p>
                  <p className="text-xs text-slate-500">
                    {outboxStatusLabel(r.status)}
                    {r.lastError ? ` · ${r.lastError}` : ""}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">id: {r.id}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-red-700 border-red-200 hover:bg-red-50 dark:text-red-300 dark:border-red-900 dark:hover:bg-red-950/50"
                  onClick={() => void removeOne(r.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Удалить
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {adminRows !== null && (
        <section className="pt-8 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600" />
            Все очереди (админ)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-4">
            Зеркало задач на сервере (пользователи с активной очередью).
          </p>
          {adminLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          ) : adminRows.length === 0 ? (
            <p className="text-sm text-slate-500">Нет записей в статусе pending/failed.</p>
          ) : (
            <ul className="space-y-2 max-h-[28rem] overflow-y-auto">
              {adminRows.map((t) => (
                <li key={t.id}>
                  <Card className="p-3 text-xs space-y-1">
                    <p className="font-medium">
                      {t.userEmail || t.userPhone || t.userId} · {t.action}
                    </p>
                    <p className="text-slate-500">{t.status}</p>
                    <p className="text-slate-400 font-mono truncate">
                      client: {t.clientLocalId ?? "—"}
                    </p>
                    {t.errorMsg ? (
                      <p className="text-red-600 dark:text-red-400">{t.errorMsg}</p>
                    ) : null}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
