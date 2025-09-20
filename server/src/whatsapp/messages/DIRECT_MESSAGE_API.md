# Direct Message API Documentation

## Overview

The Direct Message API allows you to send WhatsApp messages directly from your applications using API keys or JWT tokens. It supports text, media, mixed, and template messages with comprehensive analytics and rate limiting.

## Base URL

```
http://localhost:4000/api/messages
```

## Authentication

The API supports two authentication methods:

### 1. API Key Authentication

```http
X-API-Key: your_api_key_here
```

### 2. JWT Token Authentication

```http
Authorization: Bearer your_jwt_token_here
```

## Message Types

### Message Classification (`messageType`)

Messages are classified into different types for analytics and rate limiting:

- **`notification`** (default) - General notifications
- **`transactional`** - Order confirmations, receipts, account updates
- **`reminder`** - Appointment reminders, payment due dates
- **`promotional`** - Marketing messages, offers, announcements
- **`alert`** - Security alerts, system notifications
- **`update`** - Status updates, progress notifications

### Message Content Types (`type`)

- **`text`** - Plain text messages
- **`media`** - Images, videos, audio, documents
- **`mixed`** - Text with media
- **`template`** - Template-based messages with variables

### Media Formats

The API supports two formats for media messages:

#### **1. URL Format (Recommended for API)**

```json
{
  "type": "media",
  "media": "https://example.com/image.jpg",
  "caption": "Optional caption"
}
```

- **Auto-detection**: Media type is automatically detected from URL extension
- **Supported extensions**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.mp4`, `.avi`, `.mov`, `.webm`, `.mp3`, `.wav`, `.ogg`, `.m4a`, `.pdf`, `.doc`, `.docx`, `.txt`, etc.
- **Manual override**: Use `mediaType` field to specify type manually

#### **2. Object Format (Full control)**

```json
{
  "type": "media",
  "media": {
    "url": "https://example.com/image.jpg",
    "type": "image",
    "caption": "Optional caption",
    "fileName": "custom-name.jpg",
    "mimeType": "image/jpeg"
  }
}
```

- **Full control**: Specify all media properties manually
- **Use case**: When you need precise control over file names and MIME types

## Endpoints

### 1. Send Direct Message

Send a text, media, or mixed message.

**Endpoint:** `POST /m`

**Request Body:**

```json
{
  "phone": "+1234567890",
  "type": "text",
  "message": "Hello! This is a test message.",
  "name": "John Doe",
  "messageType": "notification",
  "priority": "normal"
}
```

**Media Message Example (URL format):**

```json
{
  "phone": "+1234567890",
  "type": "media",
  "media": "https://example.com/image.jpg",
  "caption": "Check out this image!",
  "messageType": "promotional",
  "priority": "high"
}
```

**Media Message Example (Object format):**

```json
{
  "phone": "+1234567890",
  "type": "media",
  "media": {
    "url": "https://example.com/image.jpg",
    "type": "image",
    "caption": "Check out this image!",
    "fileName": "image.jpg",
    "mimeType": "image/jpeg"
  },
  "messageType": "promotional",
  "priority": "high"
}
```

**Mixed Message Example:**

```json
{
  "phone": "+1234567890",
  "type": "mixed",
  "message": "Here's a mixed message!",
  "media": {
    "url": "https://example.com/video.mp4",
    "type": "video",
    "caption": "Video caption"
  },
  "messageType": "update",
  "priority": "normal"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Message queued for sending",
  "data": {
    "messageId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "status": "pending",
    "scheduledFor": "2024-01-15T10:30:00.000Z",
    "estimatedDelivery": "2024-01-15T10:30:00.000Z",
    "rateLimits": {
      "messagesPerMinute": 20,
      "delayBetweenMessages": 2000
    }
  }
}
```

### 2. Send Template Message

Send a template-based message with variable replacement.

**Endpoint:** `POST /m/{phone}/t/{templateId}`

**URL Parameters:**

- `phone` - Recipient phone number
- `templateId` - Template ID from your database

**Request Body:**

```json
{
  "variables": {
    "name": "John Doe",
    "company": "Acme Corp",
    "amount": "$100.00"
  },
  "messageType": "transactional",
  "priority": "high"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Template message queued for sending",
  "data": {
    "messageId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "status": "pending",
    "scheduledFor": "2024-01-15T10:30:00.000Z",
    "rateLimits": {
      "messagesPerMinute": 15,
      "delayBetweenMessages": 3000
    }
  }
}
```

### 3. Send Bulk Messages

Send multiple messages in a single request.

**Endpoint:** `POST /m/bulk`

**Request Body:**

```json
{
  "messages": [
    {
      "phone": "+1234567890",
      "type": "text",
      "message": "Bulk message 1",
      "messageType": "notification",
      "priority": "normal"
    },
    {
      "phone": "+1234567891",
      "type": "text",
      "message": "Bulk message 2",
      "messageType": "reminder",
      "priority": "high"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Processed 2 messages",
  "data": {
    "results": [
      {
        "index": 0,
        "messageId": "64f8a1b2c3d4e5f6a7b8c9d2",
        "status": "pending"
      },
      {
        "index": 1,
        "messageId": "64f8a1b2c3d4e5f6a7b8c9d3",
        "status": "pending"
      }
    ],
    "errors": [],
    "totalProcessed": 2,
    "totalErrors": 0
  }
}
```

### 4. Get Message Status

Get the status of a specific message.

**Endpoint:** `GET /m/{messageId}/status`

**Response:**

```json
{
  "success": true,
  "message": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "phone": "+1234567890",
    "type": "text",
    "status": "sent",
    "sentAt": "2024-01-15T10:30:15.000Z",
    "deliveredAt": "2024-01-15T10:30:20.000Z",
    "readAt": null,
    "lastError": null,
    "retries": 1,
    "response": { "messageId": "wa_message_id" }
  }
}
```

### 5. Get Message History

Get paginated message history with filters.

**Endpoint:** `GET /m/history`

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)
- `status` - Filter by status (pending, sent, delivered, read, failed, skipped)
- `type` - Filter by content type (text, media, template, mixed)
- `messageType` - Filter by message classification
- `phone` - Filter by phone number
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

**Response:**

```json
{
  "success": true,
  "messages": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "phone": "+1234567890",
      "type": "text",
      "messageType": "notification",
      "message": "Hello! This is a test message.",
      "status": "sent",
      "sentAt": "2024-01-15T10:30:15.000Z",
      "priority": "normal",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "pages": 1
  }
}
```

### 6. Get Message Statistics

Get overall message statistics.

**Endpoint:** `GET /m/stats`

**Query Parameters:**

- `startDate` - Start date for statistics (ISO format)
- `endDate` - End date for statistics (ISO format)

**Response:**

```json
{
  "success": true,
  "stats": {
    "total": 100,
    "pending": 5,
    "sent": 85,
    "delivered": 80,
    "read": 75,
    "failed": 10,
    "skipped": 0
  }
}
```

### 7. Get Message Statistics by Type

Get detailed statistics broken down by message type.

**Endpoint:** `GET /m/stats/by-type`

**Query Parameters:**

- `startDate` - Start date for statistics (ISO format)
- `endDate` - End date for statistics (ISO format)

**Response:**

```json
{
  "success": true,
  "stats": {
    "notification": {
      "total": 50,
      "statuses": {
        "sent": 45,
        "delivered": 40,
        "read": 35,
        "failed": 5
      }
    },
    "transactional": {
      "total": 30,
      "statuses": {
        "sent": 28,
        "delivered": 25,
        "read": 20,
        "failed": 2
      }
    },
    "promotional": {
      "total": 20,
      "statuses": {
        "sent": 15,
        "delivered": 12,
        "read": 8,
        "failed": 5
      }
    }
  }
}
```

## Rate Limiting

The API implements intelligent rate limiting based on:

- **Message Type**: Different types have different rate limits
- **User History**: Account age and performance history
- **System Load**: Current server performance
- **WhatsApp Guidelines**: Compliance with WhatsApp policies

### Rate Limit Headers

Responses include rate limiting information:

```http
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1642248000
```

### Rate Limit Exceeded

When rate limits are exceeded:

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

## Error Handling

### Common Error Codes

- `VALIDATION_ERROR` - Invalid request data
- `AUTH_REQUIRED` - Authentication required
- `INVALID_API_KEY` - Invalid API key
- `INVALID_TOKEN` - Invalid JWT token
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `TEMPLATE_NOT_FOUND` - Template not found
- `SEND_MESSAGE_ERROR` - Message sending failed

### Error Response Format

```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": ["Additional error details"]
}
```

## Message Statuses

- **`pending`** - Message queued for sending
- **`sent`** - Message sent to WhatsApp
- **`delivered`** - Message delivered to recipient
- **`read`** - Message read by recipient
- **`failed`** - Message sending failed
- **`skipped`** - Message skipped due to conditions

## Priority Levels

- **`urgent`** - Highest priority (processed first)
- **`high`** - High priority
- **`normal`** - Normal priority (default)
- **`low`** - Low priority (processed last)

## Best Practices

### 1. Message Classification

Always specify the appropriate `messageType`:

```json
{
  "messageType": "transactional", // For order confirmations
  "messageType": "reminder", // For appointment reminders
  "messageType": "promotional", // For marketing messages
  "messageType": "alert" // For security alerts
}
```

### 2. Rate Limiting

- Respect rate limits to avoid WhatsApp bans
- Use appropriate message types for better deliverability
- Monitor your message statistics regularly

### 3. Error Handling

- Always check the response status
- Implement retry logic for failed messages
- Handle rate limiting gracefully

### 4. Template Usage

- Use templates for consistent messaging
- Validate template variables before sending
- Keep templates simple and clear

## Examples

### Complete Example: Sending Different Message Types

```javascript
// 1. Send notification
const notification = await fetch("/api/messages/m", {
  method: "POST",
  headers: {
    "X-API-Key": "your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    phone: "+1234567890",
    type: "text",
    message: "Your order has been processed!",
    messageType: "notification",
    priority: "normal",
  }),
});

// 2. Send transactional message
const transactional = await fetch("/api/messages/m/+1234567890/t/template_id", {
  method: "POST",
  headers: {
    "X-API-Key": "your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    variables: {
      name: "John Doe",
      orderNumber: "12345",
      amount: "$100.00",
    },
    messageType: "transactional",
    priority: "high",
  }),
});

// 3. Send promotional message
const promotional = await fetch("/api/messages/m", {
  method: "POST",
  headers: {
    "X-API-Key": "your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    phone: "+1234567890",
    type: "media",
    media: {
      url: "https://example.com/offer.jpg",
      type: "image",
      caption: "Special offer just for you!",
    },
    messageType: "promotional",
    priority: "low",
  }),
});
```

## Support

For additional help or questions, please refer to the main application documentation or contact support.
