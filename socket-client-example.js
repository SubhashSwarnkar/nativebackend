// Socket.IO Client Example for Real-time Messaging
// This file demonstrates how to use the messaging system from the client side

const io = require('socket.io-client');

class MessagingClient {
    constructor(serverUrl, authToken) {
        this.serverUrl = serverUrl;
        this.authToken = authToken;
        this.socket = null;
        this.isAuthenticated = false;
        this.user = null;
        
        // Event handlers
        this.onMessageReceived = null;
        this.onMessageRead = null;
        this.onUserTyping = null;
        this.onUserStopTyping = null;
        this.onBroadcastMessage = null;
    }

    // Connect to the server and authenticate
    connect() {
        return new Promise((resolve, reject) => {
            this.socket = io(this.serverUrl);

            // Connection events
            this.socket.on('connect', () => {
                console.log('Connected to server');
                this.authenticate();
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
                this.isAuthenticated = false;
                this.user = null;
            });

            // Authentication events
            this.socket.on('authenticated', (data) => {
                console.log('Authentication successful:', data);
                this.isAuthenticated = true;
                this.user = data.user;
                resolve(data);
            });

            this.socket.on('authentication_error', (error) => {
                console.error('Authentication failed:', error);
                reject(error);
            });

            // Message events
            this.socket.on('new_message_to_admin', (data) => {
                console.log('New message to admin:', data);
                if (this.onMessageReceived) {
                    this.onMessageReceived(data);
                }
            });

            this.socket.on('new_message_from_admin', (data) => {
                console.log('New message from admin:', data);
                if (this.onMessageReceived) {
                    this.onMessageReceived(data);
                }
            });

            this.socket.on('new_broadcast_message', (data) => {
                console.log('New broadcast message:', data);
                if (this.onBroadcastMessage) {
                    this.onBroadcastMessage(data);
                }
            });

            this.socket.on('message_read', (data) => {
                console.log('Message read:', data);
                if (this.onMessageRead) {
                    this.onMessageRead(data);
                }
            });

            // Typing indicators
            this.socket.on('user_typing', (data) => {
                console.log('User typing:', data);
                if (this.onUserTyping) {
                    this.onUserTyping(data);
                }
            });

            this.socket.on('user_stop_typing', (data) => {
                console.log('User stopped typing:', data);
                if (this.onUserStopTyping) {
                    this.onUserStopTyping(data);
                }
            });

            // Error handling
            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                reject(error);
            });
        });
    }

    // Authenticate with the server
    authenticate() {
        if (!this.authToken) {
            throw new Error('No authentication token provided');
        }

        this.socket.emit('authenticate', { token: this.authToken });
    }

    // Send typing indicator
    sendTypingIndicator(receiverId) {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated');
        }

        this.socket.emit('typing', {
            receiverId: receiverId,
            senderId: this.user.id
        });
    }

    // Stop typing indicator
    stopTypingIndicator(receiverId) {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated');
        }

        this.socket.emit('stop_typing', {
            receiverId: receiverId,
            senderId: this.user.id
        });
    }

    // Disconnect from server
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isAuthenticated = false;
            this.user = null;
        }
    }

    // Get current user info
    getUser() {
        return this.user;
    }

    // Check if authenticated
    isConnected() {
        return this.isAuthenticated;
    }
}

// Example usage for different user types

// Example 1: Regular User Client
class UserClient extends MessagingClient {
    constructor(serverUrl, authToken) {
        super(serverUrl, authToken);
    }

    // Send message to admin
    async sendMessageToAdmin(messageBody) {
        try {
            const response = await fetch(`${this.serverUrl}/api/messages/admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ messageBody })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error sending message to admin:', error);
            throw error;
        }
    }

    // Get chat history with admins
    async getChatHistory(page = 1, limit = 20) {
        try {
            const response = await fetch(
                `${this.serverUrl}/api/messages/my-chats?page=${page}&limit=${limit}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`
                    }
                }
            );

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting chat history:', error);
            throw error;
        }
    }

    // Get all messages (complete history with filters)
    async getAllMessages(page = 1, limit = 20, filters = {}) {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString()
            });

            // Add filters
            if (filters.messageType) params.append('messageType', filters.messageType);
            if (filters.isRead !== undefined) params.append('isRead', filters.isRead.toString());

            const response = await fetch(
                `${this.serverUrl}/api/messages/my-messages?${params}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`
                    }
                }
            );

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting all messages:', error);
            throw error;
        }
    }

    // Mark message as read
    async markMessageAsRead(messageId) {
        try {
            const response = await fetch(`${this.serverUrl}/api/messages/${messageId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error marking message as read:', error);
            throw error;
        }
    }
}

// Example 2: Admin Client
class AdminClient extends MessagingClient {
    constructor(serverUrl, authToken) {
        super(serverUrl, authToken);
    }

    // Send message to specific user
    async sendMessageToUser(userId, messageBody) {
        try {
            const response = await fetch(`${this.serverUrl}/api/messages/user/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ messageBody })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error sending message to user:', error);
            throw error;
        }
    }

    // Send broadcast message
    async sendBroadcastMessage(messageBody) {
        try {
            const response = await fetch(`${this.serverUrl}/api/messages/broadcast`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ messageBody })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error sending broadcast message:', error);
            throw error;
        }
    }

    // Get all conversations
    async getConversations(unreadOnly = false, page = 1, limit = 20) {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString()
            });
            
            if (unreadOnly) {
                params.append('unreadOnly', 'true');
            }

            const response = await fetch(
                `${this.serverUrl}/api/messages/admin/conversations?${params}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`
                    }
                }
            );

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting conversations:', error);
            throw error;
        }
    }

    // Get all messages in the system (admin complete history)
    async getAllMessages(page = 1, limit = 20, filters = {}) {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString()
            });

            // Add filters
            if (filters.messageType) params.append('messageType', filters.messageType);
            if (filters.isRead !== undefined) params.append('isRead', filters.isRead.toString());
            if (filters.senderId) params.append('senderId', filters.senderId);
            if (filters.receiverId) params.append('receiverId', filters.receiverId);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await fetch(
                `${this.serverUrl}/api/messages/admin/all-messages?${params}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`
                    }
                }
            );

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting all messages:', error);
            throw error;
        }
    }

    // Get specific user's chat history
    async getUserChatHistory(userId, page = 1, limit = 20) {
        try {
            const response = await fetch(
                `${this.serverUrl}/api/messages/admin/chats/${userId}?page=${page}&limit=${limit}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`
                    }
                }
            );

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting user chat history:', error);
            throw error;
        }
    }

    // Mark message as read (admin)
    async markMessageAsRead(messageId) {
        try {
            const response = await fetch(`${this.serverUrl}/api/messages/admin/${messageId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error marking message as read:', error);
            throw error;
        }
    }
}

// Usage Examples

// Example 1: Regular User
async function userExample() {
    const userToken = 'your-user-jwt-token';
    const userClient = new UserClient('http://localhost:5000', userToken);

    try {
        // Connect and authenticate
        await userClient.connect();
        console.log('User connected:', userClient.getUser());

        // Set up event handlers
        userClient.onMessageReceived = (data) => {
            console.log('Received message:', data.message);
            // Update UI with new message
        };

        userClient.onMessageRead = (data) => {
            console.log('Message was read:', data);
            // Update message status in UI
        };

        userClient.onBroadcastMessage = (data) => {
            console.log('Broadcast received:', data.message);
            // Show broadcast notification
        };

        userClient.onUserTyping = (data) => {
            console.log('Admin is typing...');
            // Show typing indicator
        };

        userClient.onUserStopTyping = (data) => {
            console.log('Admin stopped typing');
            // Hide typing indicator
        };

        // Send message to admin
        await userClient.sendMessageToAdmin('Hello, I need help with my order');

        // Get chat history
        const history = await userClient.getChatHistory();
        console.log('Chat history:', history);

        // Get complete message history with filters
        const allMessages = await userClient.getAllMessages(1, 50, {
            messageType: 'private',
            isRead: false
        });
        console.log('All messages:', allMessages.messages);
        console.log('Statistics:', allMessages.statistics);

        // Send typing indicator
        userClient.sendTypingIndicator('admin-room-id');

        // Stop typing indicator after 3 seconds
        setTimeout(() => {
            userClient.stopTypingIndicator('admin-room-id');
        }, 3000);

    } catch (error) {
        console.error('User client error:', error);
    }
}

// Example 2: Admin User
async function adminExample() {
    const adminToken = 'your-admin-jwt-token';
    const adminClient = new AdminClient('http://localhost:5000', adminToken);

    try {
        // Connect and authenticate
        await adminClient.connect();
        console.log('Admin connected:', adminClient.getUser());

        // Set up event handlers
        adminClient.onMessageReceived = (data) => {
            console.log('Received message from user:', data.message);
            // Update admin dashboard
        };

        adminClient.onMessageRead = (data) => {
            console.log('User read message:', data);
            // Update message status
        };

        adminClient.onUserTyping = (data) => {
            console.log('User is typing...');
            // Show typing indicator
        };

        // Get all conversations
        const conversations = await adminClient.getConversations();
        console.log('All conversations:', conversations);

        // Send message to specific user
        const userId = 'user-id-here';
        await adminClient.sendMessageToUser(userId, 'Hello! How can I help you?');

        // Send broadcast message
        await adminClient.sendBroadcastMessage('Important: System maintenance scheduled for tomorrow');

        // Get specific user's chat history
        const userHistory = await adminClient.getUserChatHistory(userId);
        console.log('User chat history:', userHistory);

        // Get all messages in the system with filters
        const allSystemMessages = await adminClient.getAllMessages(1, 100, {
            messageType: 'private',
            startDate: '2024-01-01',
            endDate: '2024-12-31'
        });
        console.log('All system messages:', allSystemMessages.messages);
        console.log('System statistics:', allSystemMessages.statistics);
        console.log('Messages by date:', allSystemMessages.messagesByDate);

    } catch (error) {
        console.error('Admin client error:', error);
    }
}

// Export classes for use in other files
module.exports = {
    MessagingClient,
    UserClient,
    AdminClient
};

// Run examples if this file is executed directly
if (require.main === module) {
    console.log('Socket.IO Client Examples');
    console.log('To run examples, uncomment the function calls below and provide valid tokens:');
    
    // userExample();
    // adminExample();
} 