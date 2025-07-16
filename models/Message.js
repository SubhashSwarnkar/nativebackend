const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // null for broadcast messages
    },
    messageBody: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    },
    messageType: {
        type: String,
        enum: ['private', 'broadcast'],
        default: 'private'
    }
}, {
    timestamps: true
});

// Index for efficient querying
messageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });
messageSchema.index({ receiverId: 1, isRead: 1 });
messageSchema.index({ messageType: 1, timestamp: -1 });

// Virtual for conversation ID (for grouping messages between two users)
messageSchema.virtual('conversationId').get(function() {
    if (this.messageType === 'broadcast') {
        return 'broadcast';
    }
    // Create a consistent conversation ID regardless of sender/receiver order
    const ids = [this.senderId.toString(), this.receiverId.toString()].sort();
    return `${ids[0]}-${ids[1]}`;
});

// Ensure virtual fields are serialized
messageSchema.set('toJSON', { virtuals: true });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 