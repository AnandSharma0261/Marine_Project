import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';
import type { Drill, Ship, DrillType, DrillStatus } from '@/types';

const drillTypes: DrillType[] = [
  'fire',
  'evacuation',
  'man-overboard',
  'abandon-ship',
  'security',
  'medical',
  'other',
];

const statusVariant = (s: DrillStatus, isMissed?: boolean) =>
  s === 'completed' ? 'success' : isMissed ? 'danger' : s === 'missed' ? 'danger' : 'info';

export const Drills = () => {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ ship: 'all', status: 'all', type: 'all' });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Drill | null>(null);

  const { data: ships = [] } = useQuery<Ship[]>({
    queryKey: ['ships'],
    queryFn: async () => (await api.get('/ships')).data,
  });

  const { data: drills = [], isLoading } = useQuery<Drill[]>({
    queryKey: ['drills', filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.ship !== 'all') params.ship = filters.ship;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.type !== 'all') params.type = filters.type;
      return (await api.get('/drills', { params })).data;
    },
  });

  const createMut = useMutation({
    mutationFn: (payload: Partial<Drill>) => api.post('/drills', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drills'] });
      setOpen(false);
      setEditing(null);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Drill>) =>
      api.put(`/drills/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drills'] });
      setOpen(false);
      setEditing(null);
    },
  });

  const completeMut = useMutation({
    mutationFn: (id: string) => api.post(`/drills/${id}/complete`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drills'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/drills/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drills'] }),
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = {
      title: f.get('title') as string,
      type: f.get('type') as DrillType,
      ship: f.get('ship') as string,
      scheduledDate: f.get('scheduledDate') as string,
      durationMinutes: Number(f.get('durationMinutes')) || 30,
      notes: f.get('notes') as string,
    };
    if (editing) updateMut.mutate({ id: editing._id, ...payload });
    else createMut.mutate(payload);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Safety Drills</h1>
          <p className="text-muted-foreground">Schedule and track safety drills across ships</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> New Drill
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[160px]">
            <Label className="text-xs">Ship</Label>
            <Select
              value={filters.ship}
              onValueChange={(v) => setFilters((f) => ({ ...f, ship: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ships</SelectItem>
                {ships.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[160px]">
            <Label className="text-xs">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[160px]">
            <Label className="text-xs">Type</Label>
            <Select
              value={filters.type}
              onValueChange={(v) => setFilters((f) => ({ ...f, type: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {drillTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Ship</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && drills.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No drills found
                  </TableCell>
                </TableRow>
              )}
              {drills.map((d) => {
                const ship = typeof d.ship === 'string' ? null : d.ship;
                return (
                  <TableRow key={d._id}>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell>{ship?.name ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{d.type}</Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(d.scheduledDate)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(d.status, d.isMissed)}>
                        {d.isMissed && d.status === 'scheduled' ? 'missed' : d.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {d.status !== 'completed' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Mark completed"
                          onClick={() => completeMut.mutate(d._id)}
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditing(d);
                          setOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Delete drill "${d.title}"?`)) deleteMut.mutate(d._id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Drill' : 'New Safety Drill'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={editing?.title} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select
                  name="type"
                  defaultValue={editing?.type || 'fire'}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  required
                >
                  {drillTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Ship</Label>
                <select
                  name="ship"
                  defaultValue={
                    editing ? (typeof editing.ship === 'string' ? editing.ship : editing.ship._id) : ''
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">Select ship</option>
                  {ships.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="scheduledDate">Scheduled date/time</Label>
                <Input
                  id="scheduledDate"
                  name="scheduledDate"
                  type="datetime-local"
                  defaultValue={editing ? editing.scheduledDate.slice(0, 16) : ''}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="durationMinutes">Duration (min)</Label>
                <Input
                  id="durationMinutes"
                  name="durationMinutes"
                  type="number"
                  min={5}
                  defaultValue={editing?.durationMinutes || 30}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" defaultValue={editing?.notes} />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">{editing ? 'Save changes' : 'Schedule drill'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
