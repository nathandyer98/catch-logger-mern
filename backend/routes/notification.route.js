import express from 'express';
import { authenticatedRoute } from "../middleware/auth.middleware.js";
import { getNotifications, deleteNotifications, deleteNotification } from '../controllers/notification.controller.js';


const router = express.Router();

router.get('/', authenticatedRoute, getNotifications);

router.delete('/', authenticatedRoute, deleteNotifications);
router.delete('/:id', authenticatedRoute, deleteNotification);


export default router;