import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Edit } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { User, Ship, Role } from '@/types';

export const UsersPage = () => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<User | null>(null);

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['all-users'],
    queryFn: async () => (await api.get('/users')).data,
  });

  const { data: ships = [] } = useQuery<Ship[]>({
    queryKey: ['ships'],
    queryFn: async () => (await api.get('/ships')).data,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; role?: Role; ship?: string | null; name?: string }) =>
      api.put(`/users/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-users'] });
      setEditing(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-users'] }),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Crew & Users</h1>
        <p className="text-muted-foreground">Manage user roles and ship assignments</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Ship</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const ship = typeof u.ship === 'string' || !u.ship ? null : u.ship;
                return (
                  <TableRow key={u._id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{ship?.name ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(u)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Delete user "${u.name}"?`)) deleteMut.mutate(u._id);
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

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user — {editing?.name}</DialogTitle>
          </DialogHeader>
          {editing && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                updateMut.mutate({
                  id: editing._id,
                  role: f.get('role') as Role,
                  ship: (f.get('ship') as string) || null,
                });
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <Label>Role</Label>
                <select
                  name="role"
                  defaultValue={editing.role}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="crew">crew</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Ship</Label>
                <select
                  name="ship"
                  defaultValue={
                    typeof editing.ship === 'string' ? editing.ship : editing.ship?._id || ''
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">— None —</option>
                  {ships.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
