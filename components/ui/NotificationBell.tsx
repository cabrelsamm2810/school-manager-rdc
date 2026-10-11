'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

type Notification = {
  id: string;
  lu: boolean;
};

/**
 * Cloche de notifications avec badge dynamique.
 * Affiche le nombre de notifications non lues et le masque quand il est à zéro.
 * Interroge l'API toutes les 60 s pour rester à jour.
 */
export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      const notifs: Notification[] = data.notifications ?? [];
      setUnreadCount(notifs.filter((n) => !n.lu).length);
    } catch {
      // silent — ne pas planter la barre sur une erreur réseau
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Rafraîchir quand l'onglet redevient visible
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') fetchUnread();
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchUnread]);

  return (
    <Link
      href="/notifications"
      className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 active:bg-slate-200"
      aria-label="Notifications"
    >
      <Icon name="bell" className="h-[18px] w-[18px]" />
      {!loading && unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
