import { Router } from 'express';
import { listUsers, updateUser, deleteUser } from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/', listUsers);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
