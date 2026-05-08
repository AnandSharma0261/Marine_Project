import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Ship } from '../models/Ship';
import { MaintenanceTask } from '../models/MaintenanceTask';
import { Drill } from '../models/Drill';
import { DrillAttendance } from '../models/DrillAttendance';
import { computeShipCompliance, ShipComplianceReport } from '../utils/compliance';
import { AuthRequest } from '../middleware/auth';

export const summary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const now = new Date();

  const ships = await Ship.find().lean();

  const reports: ShipComplianceReport[] = [];
  for (const s of ships) {
    reports.push(await computeShipCompliance(s._id, s.name));
  }

  const totals = reports.reduce(
    (acc, r) => {
      acc.maintenance.total += r.maintenance.total;
      acc.maintenance.completed += r.maintenance.completed;
      acc.maintenance.pending += r.maintenance.pending;
      acc.maintenance.overdue += r.maintenance.overdue;
      acc.drills.total += r.drills.total;
      acc.drills.completed += r.drills.completed;
      acc.drills.missed += r.drills.missed;
      acc.drills.upcoming += r.drills.upcoming;
      return acc;
    },
    {
      maintenance: { total: 0, completed: 0, pending: 0, overdue: 0 },
      drills: { total: 0, completed: 0, missed: 0, upcoming: 0 },
    }
  );

  const overall =
    reports.length === 0
      ? 100
      : Math.round(
          (reports.reduce((sum, r) => sum + r.overallScore, 0) / reports.length) * 100
        ) / 100;

  const recentOverdueTasks = await MaintenanceTask.find({
    status: { $ne: 'Completed' },
    dueDate: { $lt: now },
  })
    .populate('ship', 'name')
    .populate('assignedTo', 'name')
    .sort({ dueDate: 1 })
    .limit(5);

  const upcomingDrills = await Drill.find({
    status: 'scheduled',
    scheduledDate: { $gte: now },
  })
    .populate('ship', 'name')
    .sort({ scheduledDate: 1 })
    .limit(5);

  res.json({
    overallScore: overall,
    totals,
    ships: reports,
    recentOverdueTasks,
    upcomingDrills,
  });
});

export const myDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const userId = req.user!._id;

  const myTasks = await MaintenanceTask.find({ assignedTo: userId })
    .populate('ship', 'name')
    .sort({ dueDate: 1 });

  const taskTotals = {
    total: myTasks.length,
    pending: myTasks.filter((t) => t.status === 'Pending').length,
    inProgress: myTasks.filter((t) => t.status === 'In Progress').length,
    completed: myTasks.filter((t) => t.status === 'Completed').length,
    overdue: myTasks.filter(
      (t) => t.status !== 'Completed' && t.dueDate.getTime() < now.getTime()
    ).length,
  };

  const myShipDrills = req.user!.ship
    ? await Drill.find({ ship: req.user!.ship })
        .populate('ship', 'name')
        .sort({ scheduledDate: -1 })
    : [];

  const myAttendance = await DrillAttendance.find({ user: userId });
  const attendedIds = new Set(myAttendance.filter((a) => a.attended).map((a) => a.drill.toString()));

  const drillTotals = {
    total: myShipDrills.length,
    upcoming: myShipDrills.filter(
      (d) => d.status === 'scheduled' && d.scheduledDate.getTime() >= now.getTime()
    ).length,
    completed: myShipDrills.filter((d) => d.status === 'completed').length,
    attended: myShipDrills.filter((d) => attendedIds.has(d._id.toString())).length,
  };

  res.json({
    tasks: taskTotals,
    drills: drillTotals,
    upcomingTasks: myTasks.filter((t) => t.status !== 'Completed').slice(0, 5),
    upcomingDrills: myShipDrills
      .filter((d) => d.status === 'scheduled' && d.scheduledDate.getTime() >= now.getTime())
      .slice(0, 5),
  });
});
