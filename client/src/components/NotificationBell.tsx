import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { AppNotification } from '@/types';
import { cn, formatDateTime } from '@/lib/utils';

interface NotifResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export const NotificationBell = () => {
  const qc = useQueryClient();

  const { data } = useQuery<NotifResponse>({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data,
    refetchInterval: 60000,
  });

  const markAll = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOne = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = data?.unreadCount ?? 0;
  const items = data?.notifications ?? [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <span className="font-semibold">Notifications</span>
          {unread > 0 && (
            <button
              className="text-xs text-primary hover:underline"
              onClick={() => markAll.mutate()}
            >
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-auto">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No notifications yet
            </p>
          ) : (
            items.map((n) => (
              <button
                key={n._id}
                onClick={() => !n.read && markOne.mutate(n._id)}
                className={cn(
                  'flex w-full flex-col items-start gap-1 border-b px-3 py-3 text-left text-sm hover:bg-accent',
                  !n.read && 'bg-sky-50/60'
                )}
              >
                <span className="flex w-full items-center justify-between">
                  <span className="font-medium">{n.title}</span>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                <span className="text-muted-foreground">{n.message}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(n.createdAt)}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
