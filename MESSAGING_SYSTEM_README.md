# Real-time Messaging System

This document describes the complete implementation of a real-time messaging system with Socket.IO integration for the FarmBros E-commerce platform.

## Table of Contents

1. [Data Models](#data-models)
2. [API Endpoints](#api-endpoints)
3. [Real-time Communication](#real-time-communication)
4. [Socket.IO Integration](#socketio-integration)
5. [Client Implementation](#client-implementation)
6. [Usage Examples](#usage-examples)
7. [Security Considerations](#security-considerations)

## Data Models

### User Model Updates

The User model has been enhanced with an `isAdmin` field:

```javascript
{
  // ... existing fields
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
  // ... other fields
}
```

The `isAdmin` field is automatically set based on the user's role using a pre-save hook.

### Message Model

```javascript
{
  _id: ObjectId,           // Unique identifier
  senderId: ObjectId,      // Reference to User ID (who sent it)
  receiverId: ObjectId,    // Reference to User ID (who received it) - null for broadcast
  messageBody: String,     // The text content
  timestamp: Date,         // When the message was sent
  isRead: Boolean,         // Read receipt status
  messageType: String      // Enum: 'private' or 'broadcast'
}
```

**Virtual Fields:**
- `conversationId`: Automatically generated for grouping messages between two users

**Indexes:**
- `{ senderId: 1, receiverId: 1, timestamp: -1 }` - For efficient message queries
- `{ receiverId: 1, isRead: 1 }` - For unread message queries
- `{ messageType: 1, timestamp: -1 }` - For broadcast message queries

## API Endpoints

### A. User-Specific Endpoints

#### 1. Send Message to Admin
```
POST /api/messages/admin
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "messageBody": "Hello, I need help with my order"
}
```

**Response:**
```json
{
  "message": "Message sent successfully",
  "data": {
    "_id": "message-id",
    "senderId": "user-id",
    "receiverId": "admin-id",
    "messageBody": "Hello, I need help with my order",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "isRead": false,
    "messageType": "private"
  }
}
```

#### 2. Get My Chat History with Admins
```
GET /api/messages/my-chats?page=1&limit=20
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "messages": [
    {
      "_id": "message-id",
      "senderId": { "name": "John Doe", "email": "john@example.com" },
      "receiverId": { "name": "Admin", "email": "admin@example.com" },
      "messageBody": "Hello",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "isRead": true,
      "messageType": "private"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

#### 3. Mark Message as Read
```
PUT /api/messages/{messageId}/read
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "message": "Message marked as read",
  "data": {
    "_id": "message-id",
    "isRead": true
  }
}
```

### B. Admin-Specific Endpoints

#### 1. Send Message to Specific User
```
POST /api/messages/user/{userId}
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "messageBody": "Hello! How can I help you?"
}
```

#### 2. Send Broadcast Message
```
POST /api/messages/broadcast
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "messageBody": "Important: System maintenance scheduled for tomorrow"
}
```

#### 3. Get All User Conversations
```
GET /api/messages/admin/conversations?unreadOnly=false&page=1&limit=20
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "conversations": [
    {
      "_id": "user-id",
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "lastMessage": {
        "_id": "message-id",
        "messageBody": "Hello",
        "timestamp": "2024-01-01T12:00:00.000Z"
      },
      "unreadCount": 2,
      "totalMessages": 15
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

#### 4. Get Specific User's Chat History
```
GET /api/messages/admin/chats/{userId}?page=1&limit=20
Authorization: Bearer <jwt-token>
```

#### 5. Mark Message as Read (Admin)
```
PUT /api/messages/admin/{messageId}/read
Authorization: Bearer <jwt-token>
```

## Real-time Communication

### Socket.IO Events

#### Client to Server Events

1. **Authentication**
   ```javascript
   socket.emit('authenticate', { token: 'jwt-token' });
   ```

2. **Typing Indicators**
   ```javascript
   socket.emit('typing', { receiverId: 'user-id', senderId: 'sender-id' });
   socket.emit('stop_typing', { receiverId: 'user-id', senderId: 'sender-id' });
   ```

#### Server to Client Events

1. **Authentication**
   ```javascript
   socket.on('authenticated', (data) => {
     console.log('Successfully authenticated', data);
   });
   
   socket.on('authentication_error', (error) => {
     console.error('Authentication failed', error);
   });
   ```

2. **Message Events**
   ```javascript
   // For admins receiving messages from users
   socket.on('new_message_to_admin', (data) => {
     console.log('New message from user:', data);
   });
   
   // For users receiving messages from admins
   socket.on('new_message_from_admin', (data) => {
     console.log('New message from admin:', data);
   });
   
   // For broadcast messages
   socket.on('new_broadcast_message', (data) => {
     console.log('New broadcast:', data);
   });
   ```

3. **Read Receipts**
   ```javascript
   socket.on('message_read', (data) => {
     console.log('Message was read:', data);
   });
   ```

4. **Typing Indicators**
   ```javascript
   socket.on('user_typing', (data) => {
     console.log('User is typing:', data);
   });
   
   socket.on('user_stop_typing', (data) => {
     console.log('User stopped typing:', data);
   });
   ```

## Socket.IO Integration

### Server-Side Setup

The server automatically handles Socket.IO authentication and room management:

1. **Connection**: Client connects to Socket.IO server
2. **Authentication**: Client sends JWT token via 'authenticate' event
3. **Room Assignment**: 
   - User joins their personal room (userId)
   - Admins also join the 'admins' room
4. **Real-time Events**: Messages are emitted to appropriate rooms

### Room Structure

- **Personal Rooms**: `userId` - For direct messages to specific users
- **Admin Room**: `'admins'` - For messages sent to all admins
- **Broadcast**: Global emission to all connected clients

## Client Implementation

### Basic Client Setup

```javascript
const { UserClient, AdminClient } = require('./socket-client-example');

// For regular users
const userClient = new UserClient('http://localhost:5000', 'user-jwt-token');

// For admins
const adminClient = new AdminClient('http://localhost:5000', 'admin-jwt-token');
```

### Connection and Authentication

```javascript
// Connect and authenticate
await userClient.connect();

// Set up event handlers
userClient.onMessageReceived = (data) => {
  console.log('New message:', data.message);
  // Update UI
};

userClient.onMessageRead = (data) => {
  console.log('Message read:', data);
  // Update message status
};
```

### Sending Messages

```javascript
// User sending message to admin
await userClient.sendMessageToAdmin('Hello, I need help');

// Admin sending message to specific user
await adminClient.sendMessageToUser('user-id', 'Hello! How can I help?');

// Admin sending broadcast
await adminClient.sendBroadcastMessage('Important announcement');
```

### Typing Indicators

```javascript
// Start typing indicator
userClient.sendTypingIndicator('receiver-id');

// Stop typing indicator
setTimeout(() => {
  userClient.stopTypingIndicator('receiver-id');
}, 3000);
```

## Usage Examples

### Complete User Example

```javascript
const { UserClient } = require('./socket-client-example');

async function userExample() {
  const userClient = new UserClient('http://localhost:5000', 'user-token');
  
  try {
    // Connect
    await userClient.connect();
    
    // Set up handlers
    userClient.onMessageReceived = (data) => {
      console.log('Received:', data.message.messageBody);
    };
    
    userClient.onBroadcastMessage = (data) => {
      console.log('Broadcast:', data.message.messageBody);
    };
    
    // Send message
    await userClient.sendMessageToAdmin('Hello admin!');
    
    // Get history
    const history = await userClient.getChatHistory();
    console.log('Chat history:', history.messages);
    
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Complete Admin Example

```javascript
const { AdminClient } = require('./socket-client-example');

async function adminExample() {
  const adminClient = new AdminClient('http://localhost:5000', 'admin-token');
  
  try {
    // Connect
    await adminClient.connect();
    
    // Set up handlers
    adminClient.onMessageReceived = (data) => {
      console.log('User message:', data.message.messageBody);
    };
    
    // Get conversations
    const conversations = await adminClient.getConversations();
    console.log('Conversations:', conversations.conversations);
    
    // Send broadcast
    await adminClient.sendBroadcastMessage('System maintenance notice');
    
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Security Considerations

### Authentication
- All API endpoints require JWT authentication
- Socket.IO connections require authentication before joining rooms
- Admin endpoints have additional authorization checks

### Authorization
- Users can only access their own messages
- Admins can access all messages and conversations
- Message read operations verify the user is the intended receiver

### Data Validation
- Message body is trimmed and validated
- User existence is verified before sending messages
- Pagination parameters are validated and limited

### Rate Limiting
Consider implementing rate limiting for:
- Message sending (prevent spam)
- Socket.IO connections (prevent abuse)
- API requests (prevent overload)

## Error Handling

The system includes comprehensive error handling:

- **400**: Bad Request (missing fields, invalid data)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (user/message not found)
- **500**: Server Error (database/processing errors)

## Testing

To test the messaging system:

1. **Start the server**: `npm start`
2. **Create test users**: Use the auth endpoints to create user and admin accounts
3. **Test API endpoints**: Use tools like Postman or curl
4. **Test Socket.IO**: Use the provided client examples
5. **Monitor logs**: Check server console for connection and message events

## Dependencies

The messaging system requires these packages (already included in package.json):

- `socket.io` - Real-time communication
- `jsonwebtoken` - Authentication
- `mongoose` - Database operations
- `express` - HTTP server
- `cors` - Cross-origin requests

## File Structure

```
backend/
├── models/
│   ├── User.js          # Updated with isAdmin field
│   └── Message.js       # New message model
├── controllers/
│   └── messageController.js  # Complete messaging logic
├── routes/
│   └── messages.js      # All messaging endpoints
├── middleware/
│   └── auth.js          # Authentication middleware
├── server.js            # Updated with Socket.IO
├── socket-client-example.js  # Client implementation examples
└── MESSAGING_SYSTEM_README.md # This documentation
```

This implementation provides a complete, production-ready messaging system with real-time capabilities, proper authentication, and comprehensive error handling. 