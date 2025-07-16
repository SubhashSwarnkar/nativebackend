const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { auth, isAdmin } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique message identifier
 *         senderId:
 *           type: string
 *           description: Reference to User ID who sent the message
 *         receiverId:
 *           type: string
 *           description: Reference to User ID who received the message (null for broadcast)
 *         messageBody:
 *           type: string
 *           description: The text content of the message
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the message was sent
 *         isRead:
 *           type: boolean
 *           description: Whether the message has been read
 *         messageType:
 *           type: string
 *           enum: [private, broadcast]
 *           description: Type of message
 *         conversationId:
 *           type: string
 *           description: Virtual field for grouping messages
 */

// A. User-Specific Endpoints

/**
 * @swagger
 * /api/messages/admin:
 *   post:
 *     summary: User sends a message to admin
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageBody
 *             properties:
 *               messageBody:
 *                 type: string
 *                 description: The message content
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         description: Missing message body
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No admin available
 *       500:
 *         description: Server error
 */
router.post('/admin', auth, messageController.sendMessageToAdmin);

/**
 * @swagger
 * /api/messages/my-chats:
 *   get:
 *     summary: Get user's chat history with admins
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/my-chats', auth, messageController.getMyChatHistory);

/**
 * @swagger
 * /api/messages/my-messages:
 *   get:
 *     summary: Get all user's messages (complete history with filters)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of messages per page
 *       - in: query
 *         name: messageType
 *         schema:
 *           type: string
 *           enum: [private, broadcast]
 *         description: Filter by message type
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     totalMessages:
 *                       type: integer
 *                     unreadMessages:
 *                       type: integer
 *                     privateMessages:
 *                       type: integer
 *                     broadcastMessages:
 *                       type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/my-messages', auth, messageController.getAllMyMessages);

/**
 * @swagger
 * /api/messages/{messageId}/read:
 *   put:
 *     summary: Mark message as read (user initiated)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the message to mark as read
 *     responses:
 *       200:
 *         description: Message marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to mark this message as read
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */
router.put('/:messageId/read', auth, messageController.markMessageAsRead);

// B. Admin-Specific Endpoints

/**
 * @swagger
 * /api/messages/user/{userId}:
 *   post:
 *     summary: Admin sends a message to a specific user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to send message to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageBody
 *             properties:
 *               messageBody:
 *                 type: string
 *                 description: The message content
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         description: Missing message body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/user/:userId', auth, isAdmin, messageController.sendMessageToUser);

/**
 * @swagger
 * /api/messages/broadcast:
 *   post:
 *     summary: Admin sends a broadcast message to all users
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageBody
 *             properties:
 *               messageBody:
 *                 type: string
 *                 description: The broadcast message content
 *     responses:
 *       201:
 *         description: Broadcast message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         description: Missing message body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.post('/broadcast', auth, isAdmin, messageController.sendBroadcastMessage);

/**
 * @swagger
 * /api/messages/admin/conversations:
 *   get:
 *     summary: Get all user conversations for admin dashboard
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Filter to show only unread conversations
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: timestamp
 *         description: Sort field
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of conversations per page
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       lastMessage:
 *                         $ref: '#/components/schemas/Message'
 *                       unreadCount:
 *                         type: integer
 *                       totalMessages:
 *                         type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/admin/conversations', auth, isAdmin, messageController.getAdminConversations);

/**
 * @swagger
 * /api/messages/admin/all-messages:
 *   get:
 *     summary: Get all messages in the system (admin complete history with filters)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of messages per page
 *       - in: query
 *         name: messageType
 *         schema:
 *           type: string
 *           enum: [private, broadcast]
 *         description: Filter by message type
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: senderId
 *         schema:
 *           type: string
 *         description: Filter by sender ID
 *       - in: query
 *         name: receiverId
 *         schema:
 *           type: string
 *         description: Filter by receiver ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: All messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     totalMessages:
 *                       type: integer
 *                     unreadMessages:
 *                       type: integer
 *                     privateMessages:
 *                       type: integer
 *                     broadcastMessages:
 *                       type: integer
 *                     messagesFromUsers:
 *                       type: integer
 *                     messagesToUsers:
 *                       type: integer
 *                 messagesByDate:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/admin/all-messages', auth, isAdmin, messageController.getAllMessages);

/**
 * @swagger
 * /api/messages/admin/chats/{userId}:
 *   get:
 *     summary: Get specific user's chat history for admin
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 user:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/admin/chats/:userId', auth, isAdmin, messageController.getSpecificUserChatHistory);

/**
 * @swagger
 * /api/messages/admin/{messageId}/read:
 *   put:
 *     summary: Mark message as read (admin initiated)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the message to mark as read
 *     responses:
 *       200:
 *         description: Message marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required or not authorized to mark this message as read
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */
router.put('/admin/:messageId/read', auth, isAdmin, messageController.markMessageAsReadAdmin);

module.exports = router; 