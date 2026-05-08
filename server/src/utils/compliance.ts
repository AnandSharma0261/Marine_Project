import { Types } from 'mongoose';
import { MaintenanceTask } from '../models/MaintenanceTask';
import { Drill } from '../models/Drill';
import { DrillAttendance } from '../models/DrillAttendance';
import { User } from '../models/User';

export interface ShipComplianceReport {
  shipId: string;
  shipName: string;
  maintenance: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
  };
  drills: {
    total: number;
    completed: number;
    missed: number;
    upcoming: number;
    participationRate: number;
  };
  overallScore: number;
  status: 'compliant' | 'at-risk' | 'non-compliant';
}

const round = (n: number) => Math.round(n * 100) / 100;

const classify = (score: number): 'compliant' | 'at-risk' | 'non-compliant' => {
  if (score >= 85) return 'compliant';
  if (score >= 60) return 'at-risk';
  return 'non-compliant';
};

export const computeShipCompliance = async (
  shipId: Types.ObjectId,
  shipName: string
): Promise<ShipComplianceReport> => {
  const now = new Date();

  const tasks = await MaintenanceTask.find({ ship: shipId }).lean();
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'Completed' && t.dueDate.getTime() < now.getTime()
  ).length;
  const pendingTasks = totalTasks - completedTasks;

  const maintenanceCompletionRate =
    totalTasks === 0 ? 100 : (completedTasks / totalTasks) * 100;
  const overduePenalty =
    totalTasks === 0 ? 0 : (overdueTasks / totalTasks) * 25;
  const maintenanceScore = Math.max(0, maintenanceCompletionRate - overduePenalty);

  const drills = await Drill.find({ ship: shipId }).lean();
  const totalDrills = drills.length;
  const completedDrills = drills.filter((d) => d.status === 'completed').length;
  const missedDrills = drills.filter(
    (d) => d.status === 'scheduled' && d.scheduledDate.getTime() < now.getTime()
  ).length;
  const upcomingDrills = drills.filter(
    (d) => d.status === 'scheduled' && d.scheduledDate.getTime() >= now.getTime()
  ).length;

  const crewIds = await User.find({ ship: shipId, role: 'crew' }).distinct('_id');
  const crewCount = crewIds.length;

  let participationRate = 100;
  if (completedDrills > 0 && crewCount > 0) {
    const completedDrillIds = drills
      .filter((d) => d.status === 'completed')
      .map((d) => d._id);
    const expectedAttendances = completedDrills * crewCount;
    const actualAttendances = await DrillAttendance.countDocuments({
      drill: { $in: completedDrillIds },
      attended: true,
    });
    participationRate = expectedAttendances === 0
      ? 100
      : (actualAttendances / expectedAttendances) * 100;
  }

  const drillCompletionRate = totalDrills === 0 ? 100 : (completedDrills / totalDrills) * 100;
  const drillScore = (drillCompletionRate + participationRate) / 2;

  const overallScore = (maintenanceScore + drillScore) / 2;

  return {
    shipId: shipId.toString(),
    shipName,
    maintenance: {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      overdue: overdueTasks,
      completionRate: round(maintenanceCompletionRate),
    },
    drills: {
      total: totalDrills,
      completed: completedDrills,
      missed: missedDrills,
      upcoming: upcomingDrills,
      participationRate: round(participationRate),
    },
    overallScore: round(overallScore),
    status: classify(overallScore),
  };
};
