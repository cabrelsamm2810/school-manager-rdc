'use client';

import { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/AppShell';
import { Icon } from '@/components/ui/Icon';

type Notification = {
  id: string;
  titre: string;
  message: string;
  type: string;
  lu: boolean;
  createdAt: string;
};

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; href?: string }> = {
  'Inscription': { icon: 'user', color: 'text-blue-600', bg: 'bg-blue-50', href: '/eleves' },
  'Visite': { icon: 'visit', color: 'text-purple-600', bg: 'bg-purple-50', href: '/ecoles' },
  'Évaluation': { icon: 'chart', color: 'text-amber-600', bg: 'bg-amber-50', href: '/cahier-de-cote' },
  'Dossier': { icon: 'folder', color: 'text-teal-600', bg: 'bg-teal-50', href: '/dossiers-eleves' },
  'Personnel': { icon: 'shield', color: 'text-slate-600', bg: 'bg-slate-100', href: '/profile' },
  'École': { icon: 'school', color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/ecoles' },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? { icon: 'bell', color: 'text-slate-500', bg: 'bg-slate-100' };
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function NotificationSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-50" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.lu).length;

  async function handleMarkAsRead(id: string) {
    const notif = notifications.find((n) => n.id === id);
    if (!notif || notif.lu) return;
    setProcessingId(id);
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titre: notif.titre, message: notif.message, type: notif.type, lu: true }),
      });
    } catch {
      // Revert on failure
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: false } : n)));
    } finally {
      setProcessingId(null);
    }
  }

  async function handleMarkAllRead() {
    const unread = notifications.filter((n) => !n.lu);
    if (unread.length === 0) return;
    setMarkingAll(true);
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
    try {
      await Promise.all(
        unread.map((n) =>
          fetch(`/api/notifications/${n.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titre: n.titre, message: n.message, type: n.type, lu: true }),
          })
        )
      );
    } catch {
      // Revert
      fetchNotifications();
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleDelete(id: string) {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch {
      // ignore
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-3xl">
          {/* ── Header ── */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {unreadCount > 0
                  ? `${unreadCount} notification${unreadCount > 1 ? 's non lues' : ' non lue'}`
                  : 'Toutes vos notifications sont lues'}
              </p>
            </div>
            {unreadCount > 0 && !loading && !error && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {markingAll ? (
                  <span className="btn-spinner h-4 w-4" />
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* ── Content ── */}
          {loading ? (
            <NotificationSkeleton />
          ) : error ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow-soft">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <Icon name="bell" className="h-7 w-7 text-red-400" />
              </div>
              <p className="text-sm font-medium text-slate-700">Impossible de charger les notifications.</p>
              <button
                type="button"
                onClick={fetchNotifications}
                className="mt-4 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
              >
                Réessayer
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow-soft">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                <Icon name="bell" className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-base font-semibold text-slate-700">Aucune nouvelle notification</p>
              <p className="mt-1 text-sm text-slate-400">Vous serez notifié des nouveautés ici.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => {
                const config = getTypeConfig(notif.type);
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                      notif.lu
                        ? 'border-slate-100 bg-white'
                        : 'border-blue-100 bg-blue-50/40'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${config.bg} ${config.color}`}>
                      <Icon name={config.icon} className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`truncate text-sm ${notif.lu ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                          {notif.titre}
                        </h3>
                        {!notif.lu && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                      </div>
                      {notif.message && (
                        <p className="mt-0.5 text-sm text-slate-500">{notif.message}</p>
                      )}
                      <p className="mt-1.5 text-xs text-slate-400" title={formatFullDate(notif.createdAt)}>
                        {formatRelativeDate(notif.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-col items-center gap-2">
                      {!notif.lu && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(notif.id)}
                          disabled={processingId === notif.id}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                          aria-label="Marquer comme lu"
                          title="Marquer comme lu"
                        >
                          {processingId === notif.id ? (
                            <span className="btn-spinner h-3.5 w-3.5" />
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(notif.id)}
                        disabled={processingId === notif.id}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                        aria-label="Supprimer"
                        title="Supprimer"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
