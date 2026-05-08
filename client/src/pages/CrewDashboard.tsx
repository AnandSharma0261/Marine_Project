import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ListChecks, ShieldAlert, Clock, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { formatDate, isOverdue } from '@/lib/utils';
import type { MyDashboard } from '@/types';

export const CrewDashboard = () => {
  const { user } = useAuth();
  const { data, isLoading } = useQuery<MyDashboard>({
    queryKey: ['my-dashboard'],
    queryFn: async () => (await api.get('/dashboard/me')).data,
  });

  if (isLoading || !data) return <p className="text-muted-foreground">Loading...</p>;

  const stats = [
    {
      label: 'My Tasks',
      value: data.tasks.total,
      hint: `${data.tasks.pending + data.tasks.inProgress} active`,
      icon: ListChecks,
      tone: 'bg-primary/10 text-primary',
    },
    {
      label: 'Overdue',
      value: data.tasks.overdue,
      hint: 'Action needed',
      icon: AlertTriangle,
      tone: data.tasks.overdue > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Upcoming Drills',
      value: data.drills.upcoming,
      hint: 'On your ship',
      icon: ShieldAlert,
      tone: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Drill Attendance',
      value: data.drills.completed === 0 ? '—' : `${Math.round((data.drills.attended / data.drills.completed) * 100)}%`,
      hint: `${data.drills.attended}/${data.drills.completed} drills`,
      icon: Clock,
      tone: 'bg-sky-100 text-sky-700',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name}</h1>
        <p className="text-muted-foreground">Your assigned tasks and upcoming drills</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-3xl font-semibold">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-md ${s.tone}`}>
                <s.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>My Pending Tasks</span>
              <Link to="/my-tasks" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.upcomingTasks.length === 0 ? (
              <p className="text-sm text-emerald-600">All caught up. No pending tasks.</p>
            ) : (
              data.upcomingTasks.map((t) => {
                const ship = typeof t.ship === 'string' ? null : t.ship;
                const overdue = isOverdue(t.dueDate, t.status);
                return (
                  <div
                    key={t._id}
                    className="flex items-center justify-between rounded-md border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {ship?.name} · due {formatDate(t.dueDate)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={
                          t.status === 'Completed'
                            ? 'success'
                            : t.status === 'In Progress'
                              ? 'info'
                              : 'secondary'
                        }
                      >
                        {t.status}
                      </Badge>
                      {overdue && <Badge variant="danger">overdue</Badge>}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Upcoming Drills</span>
              <Link to="/my-drills" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.upcomingDrills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming drills.</p>
            ) : (
              data.upcomingDrills.map((d) => (
                <div
                  key={d._id}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(d.scheduledDate)}</p>
                  </div>
                  <Badge variant="info">{d.type}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
