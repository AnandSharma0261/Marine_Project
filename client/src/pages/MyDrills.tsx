import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';
import type { Drill, DrillAttendance } from '@/types';

export const MyDrills = () => {
  const qc = useQueryClient();

  const { data: drills = [] } = useQuery<Drill[]>({
    queryKey: ['my-drills'],
    queryFn: async () => (await api.get('/drills')).data,
  });

  const { data: attendances = [] } = useQuery<DrillAttendance[]>({
    queryKey: ['my-attendance'],
    queryFn: async () => (await api.get('/drills/my-attendance')).data,
  });

  const attended = new Map(
    attendances.map((a) => {
      const drillId = typeof a.drill === 'string' ? a.drill : a.drill._id;
      return [drillId, a];
    })
  );

  const markMut = useMutation({
    mutationFn: ({ id, attended }: { id: string; attended: boolean }) =>
      api.post(`/drills/${id}/attendance`, { attended }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-attendance'] });
      qc.invalidateQueries({ queryKey: ['my-drills'] });
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">My Drills</h1>
        <p className="text-muted-foreground">Drills scheduled on your ship</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>My Attendance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drills.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No drills scheduled
                  </TableCell>
                </TableRow>
              )}
              {drills.map((d) => {
                const myAtt = attended.get(d._id);
                const isMissed = d.isMissed && d.status === 'scheduled';
                return (
                  <TableRow key={d._id}>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{d.type}</Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(d.scheduledDate)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          d.status === 'completed'
                            ? 'success'
                            : isMissed
                              ? 'danger'
                              : 'info'
                        }
                      >
                        {isMissed ? 'missed' : d.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {myAtt ? (
                        myAtt.attended ? (
                          <Badge variant="success">Attended</Badge>
                        ) : (
                          <Badge variant="warning">Marked absent</Badge>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">Not marked</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!myAtt?.attended && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markMut.mutate({ id: d._id, attended: true })}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Mark attended
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
