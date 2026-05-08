import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, Ship as ShipIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import type { Ship } from '@/types';

export const Ships = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ship | null>(null);

  const { data: ships = [], isLoading } = useQuery<Ship[]>({
    queryKey: ['ships'],
    queryFn: async () => (await api.get('/ships')).data,
  });

  const createMut = useMutation({
    mutationFn: (payload: Partial<Ship>) => api.post('/ships', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ships'] });
      setOpen(false);
      setEditing(null);
    },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Ship>) =>
      api.put(`/ships/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ships'] });
      setOpen(false);
      setEditing(null);
    },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/ships/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ships'] }),
  });

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = {
      name: f.get('name') as string,
      imoNumber: f.get('imoNumber') as string,
      type: f.get('type') as string,
      flag: f.get('flag') as string,
      status: f.get('status') as Ship['status'],
    };
    if (editing) updateMut.mutate({ id: editing._id, ...payload });
    else createMut.mutate(payload);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ships / Fleet</h1>
          <p className="text-muted-foreground">Manage your fleet</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> New Ship
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>IMO Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Flag</TableHead>
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
              {!isLoading && ships.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No ships configured
                  </TableCell>
                </TableRow>
              )}
              {ships.map((s) => (
                <TableRow key={s._id}>
                  <TableCell className="flex items-center gap-2 font-medium">
                    <ShipIcon className="h-4 w-4 text-muted-foreground" />
                    {s.name}
                  </TableCell>
                  <TableCell>{s.imoNumber}</TableCell>
                  <TableCell>{s.type}</TableCell>
                  <TableCell>{s.flag || '—'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        s.status === 'active'
                          ? 'success'
                          : s.status === 'maintenance'
                            ? 'warning'
                            : 'secondary'
                      }
                    >
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing(s);
                        setOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete ship "${s.name}"?`)) deleteMut.mutate(s._id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Ship' : 'New Ship'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={editing?.name} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="imoNumber">IMO Number</Label>
              <Input id="imoNumber" name="imoNumber" defaultValue={editing?.imoNumber} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <Input id="type" name="type" defaultValue={editing?.type} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="flag">Flag</Label>
                <Input id="flag" name="flag" defaultValue={editing?.flag} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select
                name="status"
                defaultValue={editing?.status || 'active'}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="active">active</option>
                <option value="docked">docked</option>
                <option value="maintenance">maintenance</option>
              </select>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
