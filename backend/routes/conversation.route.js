import express from 'express';
import { authenticatedRoute } from "../middleware/auth.middleware.js";

import { getConversations, getConversation, createConversation, deleteConversation } from '../controllers/conversation.controller.js';
import { getMessages, sendMessage } from '../controllers/message.controller.js';



const router = express.Router();
//Conversation Routes
router.get('/', authenticatedRoute, getConversations);
router.get('/:id', authenticatedRoute, getConversation);

router.post('/', authenticatedRoute, createConversation);

router.delete('/:id', authenticatedRoute, deleteConversation);



//Messages Subroutes
router.get('/:id/messages', authenticatedRoute, getMessages);

router.post('/:id/messages', authenticatedRoute, sendMessage);


export default router;