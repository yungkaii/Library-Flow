import { useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  listNotifications,
  markNotificationRead,
  notificationLabel,
} from "@/services/notifications.service";
import type { Notification } from "@/types";

export function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    listNotifications()
      .then(setNotifications)
      .catch(() => undefined);
  }, [user?.id]);

  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  const handleOpen = async (notification: Notification) => {
    if (!notification.read_at) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item,
          ),
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Notifikasi gagal diperbarui");
      }
    }
    if (notification.link) await navigate({ to: notification.link as never });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifikasi">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(24rem,calc(100vw-2rem))]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifikasi</span>
          {unreadCount > 0 && <Badge variant="secondary">{unreadCount} baru</Badge>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            Belum ada notifikasi.
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="items-start gap-3 py-3"
              onSelect={(event) => {
                event.preventDefault();
                void handleOpen(notification);
              }}
            >
              <span
                className={
                  notification.read_at
                    ? "mt-1 h-2 w-2 shrink-0 rounded-full bg-muted"
                    : "mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                }
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-medium">{notification.title}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {notificationLabel(notification.type)}
                  </span>
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {notification.message}
                </span>
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  {new Date(notification.created_at).toLocaleString("id-ID")}
                </span>
              </span>
              {!notification.read_at && (
                <CheckCheck className="mt-1 h-4 w-4 shrink-0 text-primary" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
