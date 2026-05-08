import { Router } from 'express';
import {
  listDrills,
  getDrill,
  createDrill,
  updateDrill,
  deleteDrill,
  completeDrill,
  markAttendance,
  myAttendance,
} from '../controllers/drillController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/my-attendance', myAttendance);
router.get('/', listDrills);
router.get('/:id', getDrill);
router.post('/', authorize('admin'), createDrill);
router.put('/:id', authorize('admin'), updateDrill);
router.delete('/:id', authorize('admin'), deleteDrill);
router.post('/:id/complete', authorize('admin'), completeDrill);
router.post('/:id/attendance', markAttendance);

export default router;
