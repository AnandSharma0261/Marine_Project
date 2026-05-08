import { Router } from 'express';
import {
  listShips,
  getShip,
  createShip,
  updateShip,
  deleteShip,
} from '../controllers/shipController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', listShips);
router.get('/:id', getShip);
router.post('/', authorize('admin'), createShip);
router.put('/:id', authorize('admin'), updateShip);
router.delete('/:id', authorize('admin'), deleteShip);

export default router;
