const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { auth, isAdmin } = require('../middleware/auth');

module.exports = (io) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     Message:
   *       type: object
   *       properties:
   *         message:
   *           type: string
   *           description: The message content
   *         timestamp:
   *           type: string
   *           format: date-time
   *           description: When the message was sent
   *         senderType:
   *           type: string
   *           enum: [user, admin]
   *           description: Who sent the message
   *         receiverType:
   *           type: string
   *           enum: [user, admin]
   *           description: Who received the message
   *         userDetails:
   *           type: object
   *           properties:
   *             name:
   *               type: string
   *             email:
   *               type: string
   *             phone:
   *               type: string
   *             address:
   *               type: string
   */

  /**
   * @swagger
   * /api/messages/user-to-admin:
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
   *               - userId
   *               - message
   *             properties:
   *               userId:
   *                 type: string
   *                 description: ID of the user sending the message
   *               message:
   *                 type: string
   *                 description: The message content
   *     responses:
   *       200:
   *         description: Message sent successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/Message'
   *       400:
   *         description: Missing required fields
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: User not found
   *       500:
   *         description: Server error
   */
  router.post('/user-to-admin', auth, (req, res) => {
    messageController.userSendToAdmin(req, res);
  });

  /**
   * @swagger
   * /api/messages/admin-to-user:
   *   post:
   *     summary: Admin sends a message to a specific user
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
   *               - userId
   *               - message
   *             properties:
   *               userId:
   *                 type: string
   *                 description: ID of the user to send message to
   *               message:
   *                 type: string
   *                 description: The message content
   *     responses:
   *       200:
   *         description: Message sent successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/Message'
   *       400:
   *         description: Missing required fields
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin access required
   *       404:
   *         description: User not found
   *       500:
   *         description: Server error
   */
  router.post('/admin-to-user', auth, isAdmin, (req, res) => {
    messageController.adminSendToUser(req, res);
  });

  /**
   * @swagger
   * /api/messages/user/{userId}:
   *   get:
   *     summary: Get all messages for a specific user (both sent and received)
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
   *     responses:
   *       200:
   *         description: List of messages
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   message:
   *                     type: string
   *                   timestamp:
   *                     type: string
   *                     format: date-time
   *                   senderType:
   *                     type: string
   *                     enum: [user, admin]
   *                   isFromUser:
   *                     type: boolean
   *                   userDetails:
   *                     type: object
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  router.get('/user/:userId', auth, (req, res) => {
    messageController.userGetMessages(req, res);
  });

  /**
   * @swagger
   * /api/messages/admin/all:
   *   get:
   *     summary: Get all messages in the system (admin view)
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of all messages
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Message'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin access required
   *       500:
   *         description: Server error
   */
  router.get('/admin/all', auth, isAdmin, (req, res) => {
    messageController.adminGetAllMessages(req, res);
  });

  return router;
}; 