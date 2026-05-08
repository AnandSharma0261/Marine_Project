import { Router } from 'express';
import { listMine, markRead, markAllRead } from '../controllers/notificationController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', listMine);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);

export default router;
