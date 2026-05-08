import { Router } from 'express';
import { summary, myDashboard } from '../controllers/dashboardController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/summary', authorize('admin'), summary);
router.get('/me', myDashboard);

export default router;
