import express from 'express';
import { authenticatedRoute } from "../middleware/auth.middleware.js";

import { getConversations, getConversation, createConversation, deleteConversation } from '../controllers/conversation.controller.js';
import { getMessages, sendMessage, editMessage, deleteMessage, readMessages } from '../controllers/message.controller.js';



const router = express.Router();
//Conversation Routes
router.get('/', authenticatedRoute, getConversations);
router.get('/:id', authenticatedRoute, getConversation);

router.post('/', authenticatedRoute, createConversation);

router.delete('/:id', authenticatedRoute, deleteConversation);



//Messages Subroutes
router.get('/:id/messages', authenticatedRoute, getMessages);
router.post('/:id/messages', authenticatedRoute, sendMessage);
router.put('/:id/messages/:messageId', authenticatedRoute, editMessage);
router.delete('/:id/messages/:messageId', authenticatedRoute, deleteMessage);

// router.post('/:id/messages/readAll', authenticatedRoute, readAllMessages);
router.post('/:id/messages/:messageIds/read', authenticatedRoute, readMessages);



export default router;