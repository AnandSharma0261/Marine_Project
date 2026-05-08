import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import type { MaintenanceTask, TaskStatus } from '@/types';

export const MyTasks = () => {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const [notesTask, setNotesTask] = useState<MaintenanceTask | null>(null);
  const [noteText, setNoteText] = useState('');

  const { data: tasks = [] } = useQuery<MaintenanceTask[]>({
    queryKey: ['my-tasks', filter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filter !== 'all') params.status = filter;
      return (await api.get('/tasks', { params })).data;
    },
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      api.put(`/tasks/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-tasks'] }),
  });

  const addNoteMut = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      api.post(`/tasks/${id}/notes`, { text }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['my-tasks'] });
      setNotesTask(r.data);
      setNoteText('');
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="text-muted-foreground">Tasks assigned to you</p>
      </div>

      <Card>
        <CardContent className="flex items-end gap-3 p-4">
          <div className="min-w-[200px]">
            <Label className="text-xs">Status</Label>
            <Select value={filter} onValueChange={(v) => setFilter(v as 'all' | TaskStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
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
                <TableHead>Due</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Update Status</TableHead>
                <TableHead className="text-right">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No tasks
                  </TableCell>
                </TableRow>
              )}
              {tasks.map((t) => {
                const ship = typeof t.ship === 'string' ? null : t.ship;
                const overdue = isOverdue(t.dueDate, t.status);
                return (
                  <TableRow key={t._id}>
                    <TableCell className="font-medium">
                      <div>{t.title}</div>
                      {t.description && (
                        <div className="text-xs text-muted-foreground">{t.description}</div>
                      )}
                    </TableCell>
                    <TableCell>{ship?.name ?? '—'}</TableCell>
                    <TableCell>
                      <span className={overdue ? 'font-medium text-rose-600' : ''}>
                        {formatDate(t.dueDate)}
                        {overdue && ' (overdue)'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          t.priority === 'critical'
                            ? 'danger'
                            : t.priority === 'high'
                              ? 'warning'
                              : 'secondary'
                        }
                      >
                        {t.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={t.status}
                        onValueChange={(v) =>
                          updateStatusMut.mutate({ id: t._id, status: v as TaskStatus })
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => setNotesTask(t)}>
                        <MessageSquare className="h-4 w-4" />
                        {t.notes.length > 0 && (
                          <span className="ml-1 text-xs">{t.notes.length}</span>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!notesTask} onOpenChange={(v) => !v && setNotesTask(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Notes — {notesTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="max-h-72 space-y-2 overflow-auto">
            {(!notesTask || notesTask.notes.length === 0) && (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}
            {notesTask?.notes.map((n, i) => {
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
            placeholder="Add a note about this task..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
            <Button
              disabled={!noteText.trim() || !notesTask}
              onClick={() => notesTask && addNoteMut.mutate({ id: notesTask._id, text: noteText })}
            >
              Post note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
