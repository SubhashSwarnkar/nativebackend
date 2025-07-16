const Message = require('../models/Message');
const User = require('../models/User');

// Helper function to emit Socket.IO events
const emitSocketEvent = (req, event, data) => {
    const io = req.app.get('io');
    if (io) {
        io.emit(event, data);
    }
};

// Helper function to emit to specific user
const emitToUser = (req, userId, event, data) => {
    const io = req.app.get('io');
    if (io) {
        io.to(userId.toString()).emit(event, data);
    }
};

// Helper function to emit to admins
const emitToAdmins = (req, event, data) => {
    const io = req.app.get('io');
    if (io) {
        io.to('admins').emit(event, data);
    }
};

// A. User-Specific Endpoints

// Send Message to Admin
const sendMessageToAdmin = async (req, res) => {
    try {
        const { messageBody } = req.body;
        const senderId = req.user._id;

        if (!messageBody || messageBody.trim() === '') {
            return res.status(400).json({ message: 'Message body is required' });
        }

        // Find an admin to send the message to
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            return res.status(404).json({ message: 'No admin available' });
        }

        const message = new Message({
            senderId,
            receiverId: admin._id,
            messageBody: messageBody.trim(),
            messageType: 'private'
        });

        await message.save();

        // Populate sender details for Socket.IO
        await message.populate('senderId', 'name email');
        await message.populate('receiverId', 'name email');

        // Emit real-time event to admin
        emitToUser(req, admin._id, 'new_message_to_admin', {
            message: message,
            sender: req.user
        });

        res.status(201).json({
            message: 'Message sent successfully',
            data: message
        });
    } catch (error) {
        console.error('Error sending message to admin:', error);
        res.status(500).json({ message: 'Failed to send message' });
    }
};

// Get My Chat History with Admins
const getMyChatHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Get messages where user is sender or receiver with admins
        const messages = await Message.find({
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ],
            messageType: 'private'
        })
        .populate('senderId', 'name email')
        .populate('receiverId', 'name email')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

        // Get total count for pagination
        const total = await Message.countDocuments({
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ],
            messageType: 'private'
        });

        res.json({
            messages,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting chat history:', error);
        res.status(500).json({ message: 'Failed to get chat history' });
    }
};

// Get All My Messages (User - Complete History)
const getAllMyMessages = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const { messageType, isRead } = req.query;

        // Build query
        let query = {
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ]
        };

        // Add filters
        if (messageType) {
            query.messageType = messageType;
        }
        if (isRead !== undefined) {
            query.isRead = isRead === 'true';
        }

        // Get messages
        const messages = await Message.find(query)
            .populate('senderId', 'name email role')
            .populate('receiverId', 'name email role')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const total = await Message.countDocuments(query);

        // Get statistics
        const stats = await Message.aggregate([
            { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
            {
                $group: {
                    _id: null,
                    totalMessages: { $sum: 1 },
                    unreadMessages: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ['$receiverId', userId] }, { $eq: ['$isRead', false] }] },
                                1,
                                0
                            ]
                        }
                    },
                    privateMessages: {
                        $sum: { $cond: [{ $eq: ['$messageType', 'private'] }, 1, 0] }
                    },
                    broadcastMessages: {
                        $sum: { $cond: [{ $eq: ['$messageType', 'broadcast'] }, 1, 0] }
                    }
                }
            }
        ]);

        res.json({
            messages,
            statistics: stats[0] || {
                totalMessages: 0,
                unreadMessages: 0,
                privateMessages: 0,
                broadcastMessages: 0
            },
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting all messages:', error);
        res.status(500).json({ message: 'Failed to get messages' });
    }
};

// Mark Message as Read (User Initiated)
const markMessageAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Verify user is the receiver
        if (message.receiverId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to mark this message as read' });
        }

        if (message.isRead) {
            return res.status(200).json({ message: 'Message already marked as read' });
        }

        message.isRead = true;
        await message.save();

        // Emit real-time event to original sender
        emitToUser(req, message.senderId, 'message_read', {
            messageId: message._id,
            readerId: userId
        });

        res.json({
            message: 'Message marked as read',
            data: message
        });
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({ message: 'Failed to mark message as read' });
    }
};

// B. Admin-Specific Endpoints

// Send Message to a Particular User
const sendMessageToUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { messageBody } = req.body;
        const senderId = req.user._id;

        if (!messageBody || messageBody.trim() === '') {
            return res.status(400).json({ message: 'Message body is required' });
        }

        // Verify target user exists
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const message = new Message({
            senderId,
            receiverId: userId,
            messageBody: messageBody.trim(),
            messageType: 'private'
        });

        await message.save();

        // Populate sender details for Socket.IO
        await message.populate('senderId', 'name email');
        await message.populate('receiverId', 'name email');

        // Emit real-time event to target user
        emitToUser(req, userId, 'new_message_from_admin', {
            message: message,
            sender: req.user
        });

        res.status(201).json({
            message: 'Message sent successfully',
            data: message
        });
    } catch (error) {
        console.error('Error sending message to user:', error);
        res.status(500).json({ message: 'Failed to send message' });
    }
};

// Send Broadcast Message to All Users
const sendBroadcastMessage = async (req, res) => {
    try {
        const { messageBody } = req.body;
        const senderId = req.user._id;

        if (!messageBody || messageBody.trim() === '') {
            return res.status(400).json({ message: 'Message body is required' });
        }

        const message = new Message({
            senderId,
            receiverId: null, // null for broadcast messages
            messageBody: messageBody.trim(),
            messageType: 'broadcast'
        });

        await message.save();

        // Populate sender details for Socket.IO
        await message.populate('senderId', 'name email');

        // Emit real-time broadcast event to all connected users
        emitSocketEvent(req, 'new_broadcast_message', {
            message: message,
            sender: req.user
        });

        res.status(201).json({
            message: 'Broadcast message sent successfully',
            data: message
        });
    } catch (error) {
        console.error('Error sending broadcast message:', error);
        res.status(500).json({ message: 'Failed to send broadcast message' });
    }
};

// Get All User Conversations (for Admin Dashboard)
const getAdminConversations = async (req, res) => {
    try {
        const { unreadOnly, sortBy = 'timestamp', page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        // Get all private messages
        let query = { messageType: 'private' };
        
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        // Get distinct conversations
        const conversations = await Message.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$senderId', req.user._id] },
                            '$receiverId',
                            '$senderId'
                        ]
                    },
                    lastMessage: { $last: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$receiverId', req.user._id] },
                                        { $eq: ['$isRead', false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    totalMessages: { $sum: 1 }
                }
            },
            { $sort: { 'lastMessage.timestamp': -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ]);

        // Populate user details for each conversation
        const populatedConversations = await Promise.all(
            conversations.map(async (conv) => {
                const user = await User.findById(conv._id).select('name email');
                return {
                    ...conv,
                    user
                };
            })
        );

        // Get total count for pagination
        const total = await Message.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$senderId', req.user._id] },
                            '$receiverId',
                            '$senderId'
                        ]
                    }
                }
            },
            { $count: 'total' }
        ]);

        res.json({
            conversations: populatedConversations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total[0]?.total || 0,
                pages: Math.ceil((total[0]?.total || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error getting admin conversations:', error);
        res.status(500).json({ message: 'Failed to get conversations' });
    }
};

// Get All Messages (Admin - Complete System History)
const getAllMessages = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const { messageType, isRead, senderId, receiverId, startDate, endDate } = req.query;

        // Build query
        let query = {};

        // Add filters
        if (messageType) {
            query.messageType = messageType;
        }
        if (isRead !== undefined) {
            query.isRead = isRead === 'true';
        }
        if (senderId) {
            query.senderId = senderId;
        }
        if (receiverId) {
            query.receiverId = receiverId;
        }
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                query.timestamp.$lte = new Date(endDate);
            }
        }

        // Get messages
        const messages = await Message.find(query)
            .populate('senderId', 'name email role')
            .populate('receiverId', 'name email role')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const total = await Message.countDocuments(query);

        // Get comprehensive statistics
        const stats = await Message.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalMessages: { $sum: 1 },
                    unreadMessages: {
                        $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
                    },
                    privateMessages: {
                        $sum: { $cond: [{ $eq: ['$messageType', 'private'] }, 1, 0] }
                    },
                    broadcastMessages: {
                        $sum: { $cond: [{ $eq: ['$messageType', 'broadcast'] }, 1, 0] }
                    },
                    messagesFromUsers: {
                        $sum: {
                            $cond: [
                                { $ne: ['$senderId', req.user._id] },
                                1,
                                0
                            ]
                        }
                    },
                    messagesToUsers: {
                        $sum: {
                            $cond: [
                                { $ne: ['$receiverId', req.user._id] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        // Get messages by date (for charts)
        const messagesByDate = await Message.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$timestamp"
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } },
            { $limit: 30 } // Last 30 days
        ]);

        res.json({
            messages,
            statistics: stats[0] || {
                totalMessages: 0,
                unreadMessages: 0,
                privateMessages: 0,
                broadcastMessages: 0,
                messagesFromUsers: 0,
                messagesToUsers: 0
            },
            messagesByDate,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting all messages:', error);
        res.status(500).json({ message: 'Failed to get messages' });
    }
};

// Get Specific User's Chat History (for Admin)
const getSpecificUserChatHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Verify user exists
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get messages between admin and specific user
        const messages = await Message.find({
            $or: [
                { senderId: req.user._id, receiverId: userId },
                { senderId: userId, receiverId: req.user._id }
            ],
            messageType: 'private'
        })
        .populate('senderId', 'name email')
        .populate('receiverId', 'name email')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

        // Get total count for pagination
        const total = await Message.countDocuments({
            $or: [
                { senderId: req.user._id, receiverId: userId },
                { senderId: userId, receiverId: req.user._id }
            ],
            messageType: 'private'
        });

        res.json({
            messages,
            user: targetUser,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting specific user chat history:', error);
        res.status(500).json({ message: 'Failed to get chat history' });
    }
};

// Mark Message as Read (Admin Initiated)
const markMessageAsReadAdmin = async (req, res) => {
    try {
        const { messageId } = req.params;
        const adminId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Verify admin is the receiver
        if (message.receiverId.toString() !== adminId.toString()) {
            return res.status(403).json({ message: 'Not authorized to mark this message as read' });
        }

        if (message.isRead) {
            return res.status(200).json({ message: 'Message already marked as read' });
        }

        message.isRead = true;
        await message.save();

        // Emit real-time event to original sender (user)
        emitToUser(req, message.senderId, 'message_read', {
            messageId: message._id,
            readerId: adminId
        });

        res.json({
            message: 'Message marked as read',
            data: message
        });
    } catch (error) {
        console.error('Error marking message as read (admin):', error);
        res.status(500).json({ message: 'Failed to mark message as read' });
    }
};

module.exports = {
    // User endpoints
    sendMessageToAdmin,
    getMyChatHistory,
    getAllMyMessages,
    markMessageAsRead,
    
    // Admin endpoints
    sendMessageToUser,
    sendBroadcastMessage,
    getAdminConversations,
    getAllMessages,
    getSpecificUserChatHistory,
    markMessageAsReadAdmin
}; 