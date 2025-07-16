# Message History Features

This document describes the comprehensive message history features available for both users and admins in the messaging system.

## 📋 Table of Contents

1. [User Message History](#user-message-history)
2. [Admin Message History](#admin-message-history)
3. [Filtering Options](#filtering-options)
4. [Statistics & Analytics](#statistics--analytics)
5. [API Endpoints](#api-endpoints)
6. [Usage Examples](#usage-examples)

## 👤 User Message History

### 1. Chat History with Admins
**Endpoint:** `GET /api/messages/my-chats`

Returns messages between the user and admins only.

**Features:**
- Pagination support
- Sorted by timestamp (newest first)
- Populated sender/receiver details

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

### 2. Complete Message History
**Endpoint:** `GET /api/messages/my-messages`

Returns ALL messages involving the user (sent and received).

**Features:**
- Complete message history
- Advanced filtering options
- Statistics included
- Both private and broadcast messages

**Filters Available:**
- `messageType`: 'private' or 'broadcast'
- `isRead`: true/false
- `page`: pagination
- `limit`: items per page

**Response:**
```json
{
  "messages": [...],
  "statistics": {
    "totalMessages": 150,
    "unreadMessages": 5,
    "privateMessages": 120,
    "broadcastMessages": 30
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## 👨‍💼 Admin Message History

### 1. User Conversations Overview
**Endpoint:** `GET /api/messages/admin/conversations`

Returns a list of all user conversations with summary information.

**Features:**
- Conversation summaries
- Unread message counts
- Last message preview
- Pagination support

**Filters:**
- `unreadOnly`: Show only conversations with unread messages
- `page`: pagination
- `limit`: items per page

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

### 2. Complete System History
**Endpoint:** `GET /api/messages/admin/all-messages`

Returns ALL messages in the entire system with comprehensive analytics.

**Features:**
- Complete system message history
- Advanced filtering options
- Comprehensive statistics
- Date-based analytics
- User-specific filtering

**Filters Available:**
- `messageType`: 'private' or 'broadcast'
- `isRead`: true/false
- `senderId`: Filter by sender
- `receiverId`: Filter by receiver
- `startDate`: Filter from date (YYYY-MM-DD)
- `endDate`: Filter to date (YYYY-MM-DD)
- `page`: pagination
- `limit`: items per page

**Response:**
```json
{
  "messages": [...],
  "statistics": {
    "totalMessages": 1000,
    "unreadMessages": 25,
    "privateMessages": 800,
    "broadcastMessages": 200,
    "messagesFromUsers": 600,
    "messagesToUsers": 400
  },
  "messagesByDate": [
    {
      "_id": "2024-01-01",
      "count": 15
    },
    {
      "_id": "2024-01-02", 
      "count": 23
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1000,
    "pages": 50
  }
}
```

### 3. Specific User Chat History
**Endpoint:** `GET /api/messages/admin/chats/:userId`

Returns complete chat history with a specific user.

**Features:**
- All messages with specific user
- User details included
- Pagination support

**Response:**
```json
{
  "messages": [...],
  "user": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

## 🔍 Filtering Options

### User Filters
| Filter | Type | Description |
|--------|------|-------------|
| `messageType` | string | 'private' or 'broadcast' |
| `isRead` | boolean | true/false |
| `page` | integer | Page number |
| `limit` | integer | Items per page |

### Admin Filters
| Filter | Type | Description |
|--------|------|-------------|
| `messageType` | string | 'private' or 'broadcast' |
| `isRead` | boolean | true/false |
| `senderId` | string | Filter by sender ID |
| `receiverId` | string | Filter by receiver ID |
| `startDate` | string | Start date (YYYY-MM-DD) |
| `endDate` | string | End date (YYYY-MM-DD) |
| `unreadOnly` | boolean | Show only unread conversations |
| `page` | integer | Page number |
| `limit` | integer | Items per page |

## 📊 Statistics & Analytics

### User Statistics
- **totalMessages**: Total messages sent/received
- **unreadMessages**: Unread messages received
- **privateMessages**: Private messages count
- **broadcastMessages**: Broadcast messages count

### Admin Statistics
- **totalMessages**: Total messages in system
- **unreadMessages**: Unread messages in system
- **privateMessages**: Private messages count
- **broadcastMessages**: Broadcast messages count
- **messagesFromUsers**: Messages sent by users
- **messagesToUsers**: Messages sent to users
- **messagesByDate**: Daily message counts (last 30 days)

## 🛠️ API Endpoints Summary

### User Endpoints
```
GET /api/messages/my-chats          # Chat history with admins
GET /api/messages/my-messages       # Complete message history
PUT /api/messages/:messageId/read   # Mark message as read
```

### Admin Endpoints
```
GET /api/messages/admin/conversations    # User conversations overview
GET /api/messages/admin/all-messages     # Complete system history
GET /api/messages/admin/chats/:userId    # Specific user chat history
PUT /api/messages/admin/:messageId/read  # Mark message as read
```

## 💻 Usage Examples

### User Examples

```javascript
// Get chat history with admins
const chatHistory = await userClient.getChatHistory(1, 20);
console.log('Chat history:', chatHistory.messages);

// Get complete message history with filters
const allMessages = await userClient.getAllMessages(1, 50, {
    messageType: 'private',
    isRead: false
});
console.log('Unread private messages:', allMessages.messages);
console.log('Statistics:', allMessages.statistics);
```

### Admin Examples

```javascript
// Get user conversations
const conversations = await adminClient.getConversations(false, 1, 20);
console.log('Conversations:', conversations.conversations);

// Get complete system history with date filter
const systemHistory = await adminClient.getAllMessages(1, 100, {
    messageType: 'private',
    startDate: '2024-01-01',
    endDate: '2024-12-31'
});
console.log('System messages:', systemHistory.messages);
console.log('System statistics:', systemHistory.statistics);
console.log('Daily counts:', systemHistory.messagesByDate);

// Get specific user's chat history
const userHistory = await adminClient.getUserChatHistory('user-id');
console.log('User chat history:', userHistory.messages);
```

## 🔐 Security Features

- **Authentication Required**: All endpoints require JWT token
- **Authorization**: Users can only access their own messages
- **Admin Access**: Admins can access all messages in the system
- **Data Validation**: All filters are validated and sanitized
- **Rate Limiting**: Consider implementing rate limiting for large queries

## 📈 Performance Considerations

- **Indexed Queries**: Database indexes for efficient message retrieval
- **Pagination**: All endpoints support pagination to handle large datasets
- **Selective Population**: Only necessary user fields are populated
- **Aggregation**: Statistics use MongoDB aggregation for performance
- **Date Filtering**: Efficient date-based filtering for analytics

## 🎯 Use Cases

### For Users
- View conversation history with support team
- Check unread messages
- Filter messages by type (private/broadcast)
- Track message statistics

### For Admins
- Monitor all user conversations
- Analyze message patterns
- Generate reports and analytics
- Track system usage
- Manage support conversations
- Filter messages by various criteria

This comprehensive message history system provides both users and admins with powerful tools to manage and analyze their messaging data effectively. 