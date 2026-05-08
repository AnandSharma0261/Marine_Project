import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AlertTriangle, CheckCircle2, Clock, Wrench, ShieldAlert, Ship } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, isOverdue } from '@/lib/utils';
import type { DashboardSummary } from '@/types';

const STATUS_COLORS = {
  compliant: '#10b981',
  'at-risk': '#f59e0b',
  'non-compliant': '#ef4444',
};

const TASK_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

interface StatProps {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ElementType;
  tone?: 'default' | 'good' | 'warn' | 'bad';
}

const Stat = ({ label, value, hint, icon: Icon, tone = 'default' }: StatProps) => {
  const tones: Record<string, string> = {
    default: 'bg-primary/10 text-primary',
    good: 'bg-emerald-100 text-emerald-700',
    warn: 'bg-amber-100 text-amber-700',
    bad: 'bg-rose-100 text-rose-700',
  };
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-semibold">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
};

export const AdminDashboard = () => {
  const { data, isLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: async () => (await api.get('/dashboard/summary')).data,
  });

  if (isLoading || !data) {
    return <p className="text-muted-foreground">Loading dashboard...</p>;
  }

  const taskBreakdown = [
    { name: 'Completed', value: data.totals.maintenance.completed },
    { name: 'Pending', value: data.totals.maintenance.pending - data.totals.maintenance.overdue },
    { name: 'Overdue', value: data.totals.maintenance.overdue },
  ].filter((d) => d.value > 0);

  const drillBreakdown = [
    { name: 'Completed', value: data.totals.drills.completed },
    { name: 'Upcoming', value: data.totals.drills.upcoming },
    { name: 'Missed', value: data.totals.drills.missed },
  ].filter((d) => d.value > 0);

  const shipChartData = data.ships.map((s) => ({
    name: s.shipName,
    Maintenance: s.maintenance.completionRate,
    Drills: s.drills.participationRate,
    Overall: s.overallScore,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Compliance Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time view of maintenance, drills and fleet compliance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Overall Compliance"
          value={`${data.overallScore}%`}
          hint={`${data.ships.length} ships tracked`}
          icon={Ship}
          tone={data.overallScore >= 85 ? 'good' : data.overallScore >= 60 ? 'warn' : 'bad'}
        />
        <Stat
          label="Pending Maintenance"
          value={data.totals.maintenance.pending}
          hint={`${data.totals.maintenance.completed} completed`}
          icon={Wrench}
          tone="default"
        />
        <Stat
          label="Overdue Tasks"
          value={data.totals.maintenance.overdue}
          hint="Need immediate attention"
          icon={AlertTriangle}
          tone={data.totals.maintenance.overdue > 0 ? 'bad' : 'good'}
        />
        <Stat
          label="Missed Drills"
          value={data.totals.drills.missed}
          hint={`${data.totals.drills.upcoming} upcoming`}
          icon={ShieldAlert}
          tone={data.totals.drills.missed > 0 ? 'bad' : 'good'}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maintenance Breakdown</CardTitle>
            <CardDescription>Status of all maintenance tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {taskBreakdown.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No tasks yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={taskBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {taskBreakdown.map((_, idx) => (
                      <Cell key={idx} fill={TASK_COLORS[idx]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Drills Breakdown</CardTitle>
            <CardDescription>Scheduled vs completed drills</CardDescription>
          </CardHeader>
          <CardContent>
            {drillBreakdown.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No drills yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={drillBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {drillBreakdown.map((_, idx) => (
                      <Cell key={idx} fill={TASK_COLORS[idx]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance by Ship</CardTitle>
            <CardDescription>Maintenance vs drill compliance</CardDescription>
          </CardHeader>
          <CardContent>
            {shipChartData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No ships</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={shipChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Maintenance" fill="#3b82f6" />
                  <Bar dataKey="Drills" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ship Compliance Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.ships.length === 0 && (
              <p className="text-sm text-muted-foreground">No ships configured yet.</p>
            )}
            {data.ships.map((s) => (
              <div
                key={s.shipId}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">{s.shipName}</p>
                  <p className="text-xs text-muted-foreground">
                    Maintenance {s.maintenance.completionRate}% · Drills{' '}
                    {s.drills.participationRate}%
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-xl font-semibold"
                    style={{ color: STATUS_COLORS[s.status] }}
                  >
                    {s.overallScore}%
                  </p>
                  <Badge
                    variant={
                      s.status === 'compliant'
                        ? 'success'
                        : s.status === 'at-risk'
                          ? 'warning'
                          : 'danger'
                    }
                  >
                    {s.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                Overdue Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.recentOverdueTasks.length === 0 ? (
                <p className="text-sm text-emerald-600">All tasks on track.</p>
              ) : (
                data.recentOverdueTasks.map((t) => {
                  const ship = typeof t.ship === 'string' ? null : t.ship;
                  return (
                    <div
                      key={t._id}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{t.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {ship?.name} · due {formatDate(t.dueDate)}
                        </p>
                      </div>
                      <Badge variant="danger">overdue</Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-sky-500" />
                Upcoming Drills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.upcomingDrills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming drills.</p>
              ) : (
                data.upcomingDrills.map((d) => {
                  const ship = typeof d.ship === 'string' ? null : d.ship;
                  return (
                    <div
                      key={d._id}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{d.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {ship?.name} · {formatDate(d.scheduledDate)}
                        </p>
                      </div>
                      <Badge variant="info">{d.type}</Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Suppress unused warning for icon import
void CheckCircle2;
void isOverdue;
