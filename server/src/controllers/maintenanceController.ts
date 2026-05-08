import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { MaintenanceTask } from '../models/MaintenanceTask';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

interface TaskQuery {
  ship?: string;
  status?: string;
  assignedTo?: string;
  dueBefore?: string;
  dueAfter?: string;
  overdue?: string;
  mine?: string;
}

export const listTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = req.query as TaskQuery;
  const filter: Record<string, unknown> = {};

  if (req.user!.role === 'crew') {
    filter.assignedTo = req.user!._id;
  } else {
    if (q.assignedTo) filter.assignedTo = q.assignedTo;
    if (q.mine === 'true') filter.assignedTo = req.user!._id;
  }

  if (q.ship) filter.ship = q.ship;
  if (q.status) filter.status = q.status;

  const dueDateFilter: Record<string, Date> = {};
  if (q.dueBefore) dueDateFilter.$lte = new Date(q.dueBefore);
  if (q.dueAfter) dueDateFilter.$gte = new Date(q.dueAfter);
  if (Object.keys(dueDateFilter).length) filter.dueDate = dueDateFilter;

  if (q.overdue === 'true') {
    filter.status = { $ne: 'Completed' };
    filter.dueDate = { ...(filter.dueDate as object), $lt: new Date() };
  }

  const tasks = await MaintenanceTask.find(filter)
    .populate('ship', 'name imoNumber')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort({ dueDate: 1 });

  res.json(tasks);
});

export const getTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await MaintenanceTask.findById(req.params.id)
    .populate('ship', 'name imoNumber')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('notes.user', 'name');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  if (
    req.user!.role === 'crew' &&
    task.assignedTo &&
    task.assignedTo._id.toString() !== req.user!._id.toString()
  ) {
    res.status(403);
    throw new Error('Forbidden');
  }

  res.json(task);
});

export const createTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, ship, assignedTo, dueDate, priority } = req.body;
  const task = await MaintenanceTask.create({
    title,
    description,
    ship,
    assignedTo: assignedTo || null,
    createdBy: req.user!._id,
    dueDate,
    priority: priority || 'medium',
  });

  if (assignedTo) {
    await Notification.create({
      user: assignedTo,
      type: 'task-assigned',
      title: 'New maintenance task assigned',
      message: `You have been assigned: ${title}`,
      link: `/tasks/${task._id}`,
    });
  }

  const populated = await task.populate([
    { path: 'ship', select: 'name imoNumber' },
    { path: 'assignedTo', select: 'name email' },
  ]);
  res.status(201).json(populated);
});

export const updateTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await MaintenanceTask.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  if (req.user!.role === 'crew') {
    const isAssignee =
      task.assignedTo && task.assignedTo.toString() === req.user!._id.toString();
    if (!isAssignee) {
      res.status(403);
      throw new Error('Only assigned crew can update this task');
    }
    if (req.body.status) task.status = req.body.status;
  } else {
    const updatable = ['title', 'description', 'ship', 'assignedTo', 'dueDate', 'status', 'priority'];
    for (const key of updatable) {
      if (key in req.body) (task as unknown as Record<string, unknown>)[key] = req.body[key];
    }
  }

  if (task.status === 'Completed' && !task.completedAt) {
    task.completedAt = new Date();
  }
  if (task.status !== 'Completed') {
    task.completedAt = null;
  }

  await task.save();
  const populated = await task.populate([
    { path: 'ship', select: 'name imoNumber' },
    { path: 'assignedTo', select: 'name email' },
  ]);
  res.json(populated);
});

export const addNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { text } = req.body;
  if (!text) {
    res.status(400);
    throw new Error('Note text is required');
  }
  const task = await MaintenanceTask.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  if (
    req.user!.role === 'crew' &&
    (!task.assignedTo || task.assignedTo.toString() !== req.user!._id.toString())
  ) {
    res.status(403);
    throw new Error('Only assigned crew can add notes');
  }
  task.notes.push({
    user: req.user!._id,
    text,
    createdAt: new Date(),
  } as never);
  await task.save();
  const populated = await task.populate([
    { path: 'ship', select: 'name imoNumber' },
    { path: 'assignedTo', select: 'name email' },
    { path: 'notes.user', select: 'name' },
  ]);
  res.json(populated);
});

export const deleteTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await MaintenanceTask.findByIdAndDelete(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  res.json({ message: 'Task removed' });
});
