import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, MessageSquare } from 'lucide-react';
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
import { formatDate, isOverdue } from '@/lib/utils';
import type { MaintenanceTask, Ship, User, TaskStatus, TaskPriority } from '@/types';

interface Filters {
  ship: string;
  status: string;
  overdue: boolean;
}

const statusVariant = (s: TaskStatus) =>
  s === 'Completed' ? 'success' : s === 'In Progress' ? 'info' : 'secondary';

const priorityVariant = (p: TaskPriority) =>
  p === 'critical' ? 'danger' : p === 'high' ? 'warning' : p === 'medium' ? 'info' : 'secondary';

export const Maintenance = () => {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<Filters>({ ship: 'all', status: 'all', overdue: false });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceTask | null>(null);
  const [notesTask, setNotesTask] = useState<MaintenanceTask | null>(null);

  const { data: ships = [] } = useQuery<Ship[]>({
    queryKey: ['ships'],
    queryFn: async () => (await api.get('/ships')).data,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users', 'crew'],
    queryFn: async () => (await api.get('/users?role=crew')).data,
  });

  const { data: tasks = [], isLoading } = useQuery<MaintenanceTask[]>({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.ship !== 'all') params.ship = filters.ship;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.overdue) params.overdue = 'true';
      return (await api.get('/tasks', { params })).data;
    },
  });

  const createMut = useMutation({
    mutationFn: (payload: Partial<MaintenanceTask>) => api.post('/tasks', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setOpen(false);
      setEditing(null);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<MaintenanceTask>) =>
      api.put(`/tasks/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setOpen(false);
      setEditing(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = {
      title: f.get('title') as string,
      description: f.get('description') as string,
      ship: f.get('ship') as string,
      assignedTo: (f.get('assignedTo') as string) || null,
      dueDate: f.get('dueDate') as string,
      priority: f.get('priority') as TaskPriority,
      status: f.get('status') as TaskStatus,
    };
    if (editing) updateMut.mutate({ id: editing._id, ...payload });
    else createMut.mutate(payload);
  };

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (t: MaintenanceTask) => {
    setEditing(t);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maintenance Tasks</h1>
          <p className="text-muted-foreground">Manage maintenance work across the fleet</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Task
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
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant={filters.overdue ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => setFilters((f) => ({ ...f, overdue: !f.overdue }))}
          >
            Overdue only
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Ship</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No tasks found
                  </TableCell>
                </TableRow>
              )}
              {tasks.map((t) => {
                const ship = typeof t.ship === 'string' ? null : t.ship;
                const assignee = typeof t.assignedTo === 'string' ? null : t.assignedTo;
                const overdue = isOverdue(t.dueDate, t.status);
                return (
                  <TableRow key={t._id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell>{ship?.name ?? '—'}</TableCell>
                    <TableCell>{assignee?.name ?? 'Unassigned'}</TableCell>
                    <TableCell>
                      <span className={overdue ? 'text-rose-600 font-medium' : ''}>
                        {formatDate(t.dueDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityVariant(t.priority)}>{t.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setNotesTask(t)}
                        title="Notes"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(t)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Delete task "${t.title}"?`)) deleteMut.mutate(t._id);
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
            <DialogTitle>{editing ? 'Edit Task' : 'New Maintenance Task'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={editing?.title} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={editing?.description} />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                <Label>Assign to</Label>
                <select
                  name="assignedTo"
                  defaultValue={
                    editing
                      ? typeof editing.assignedTo === 'string'
                        ? editing.assignedTo
                        : editing.assignedTo?._id || ''
                      : ''
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Due date</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  defaultValue={editing ? editing.dueDate.slice(0, 10) : ''}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <select
                  name="priority"
                  defaultValue={editing?.priority || 'medium'}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="critical">critical</option>
                </select>
              </div>
              {editing && (
                <div className="space-y-1.5 col-span-2">
                  <Label>Status</Label>
                  <select
                    name="status"
                    defaultValue={editing.status}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                {editing ? 'Save changes' : 'Create task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <NotesDialog
        task={notesTask}
        onClose={() => setNotesTask(null)}
        onChanged={() => qc.invalidateQueries({ queryKey: ['tasks'] })}
      />
    </div>
  );
};

const NotesDialog = ({
  task,
  onClose,
  onChanged,
}: {
  task: MaintenanceTask | null;
  onClose: () => void;
  onChanged: () => void;
}) => {
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const submit = async () => {
    if (!task || !text.trim()) return;
    setPosting(true);
    try {
      await api.post(`/tasks/${task._id}/notes`, { text });
      setText('');
      onChanged();
    } finally {
      setPosting(false);
    }
  };

  if (!task) return null;
  return (
    <Dialog open={!!task} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Notes — {task.title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-72 space-y-2 overflow-auto">
          {task.notes.length === 0 && (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          )}
          {task.notes.map((n, i) => {
            const author = typeof n.user === 'string' ? null : n.user;
            return (
              <div key={i} className="rounded-md border p-2 text-sm">
                <p>{n.text}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {author?.name} · {formatDate(n.createdAt)}
                </p>
              </div>
            );
          })}
        </div>
        <Textarea
          placeholder="Add a note..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          <Button onClick={submit} disabled={!text.trim() || posting}>
            Post note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
