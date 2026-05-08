import { Router } from 'express';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  addNote,
  deleteTask,
} from '../controllers/maintenanceController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', listTasks);
router.get('/:id', getTask);
router.post('/', authorize('admin'), createTask);
router.put('/:id', updateTask);
router.post('/:id/notes', addNote);
router.delete('/:id', authorize('admin'), deleteTask);

export default router;
