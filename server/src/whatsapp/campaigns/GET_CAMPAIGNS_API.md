# Get Campaigns API Documentation

## Endpoint

```
GET /api/whatsapp/campaigns
```

## Authentication

Requires valid authentication token in headers.

## Query Parameters

### Pagination

- `page` (number, default: 1): Page number for pagination
- `limit` (number, default: 10, max: 100): Number of campaigns per page

### Search

- `search` (string): Search term to match against campaign name and description (case-insensitive)

### Filtering

- `status` (string): Filter by campaign status

  - Values: `draft`, `scheduled`, `running`, `paused`, `completed`, `failed`
  - Use `all` or omit to include all statuses

- `campaignType` (string): Filter by campaign type

  - Values: `marketing`, `transactional`, `notification`, `reminder`, `other`
  - Use `all` or omit to include all types

- `strategyMode` (string): Filter by strategy mode

  - Values: `single`, `ab`, `multivariate`
  - Use `all` or omit to include all modes

- `scheduleType` (string): Filter by schedule type
  - Values: `immediate`, `scheduled`, `delayed`
  - Use `all` or omit to include all types

### Date Range Filtering

- `startDate` (string): Start date for filtering campaigns created after this date (ISO date string)
- `endDate` (string): End date for filtering campaigns created before this date (ISO date string)

### Recipients Count Filtering

- `minRecipients` (number): Minimum number of total recipients
- `maxRecipients` (number): Maximum number of total recipients

### Metrics Filtering

- `minMetrics` (JSON string): Minimum values for metrics
  - Format: `{"sent": 10, "delivered": 5, "read": 2, "failed": 1}`
  - Only include fields you want to filter by
- `maxMetrics` (JSON string): Maximum values for metrics
  - Format: `{"sent": 100, "delivered": 80, "read": 50, "failed": 10}`
  - Only include fields you want to filter by

### Sorting

- `sortBy` (string, default: "createdAt"): Field to sort by
  - Available fields: `name`, `createdAt`, `updatedAt`, `scheduledDate`, `metrics.totalRecipients`, `metrics.sent`, `metrics.delivered`, `metrics.read`, `metrics.failed`
- `sortOrder` (string, default: "desc"): Sort order
  - Values: `asc`, `desc`

## Example Requests

### Basic Request

```
GET /api/whatsapp/campaigns?page=1&limit=20
```

### Search and Filter

```
GET /api/whatsapp/campaigns?search=marketing&status=running&campaignType=marketing&page=1&limit=15
```

### Date Range and Metrics

```
GET /api/whatsapp/campaigns?startDate=2024-01-01&endDate=2024-12-31&minMetrics={"sent": 100}&maxMetrics={"failed": 10}
```

### Advanced Filtering with Sorting

```
GET /api/whatsapp/campaigns?status=completed&minRecipients=1000&sortBy=metrics.totalRecipients&sortOrder=desc&page=1&limit=25
```

## Response Format

### Success Response (200)

```json
{
  "success": true,
  "message": "Campaigns fetched successfully",
  "data": {
    "campaigns": [
      {
        "_id": "campaign_id",
        "name": "Campaign Name",
        "description": "Campaign Description",
        "campaignType": "marketing",
        "strategy": {
          "mode": "single"
        },
        "status": "running",
        "scheduleType": "immediate",
        "scheduledDate": null,
        "timeZone": "IST",
        "metrics": {
          "totalRecipients": 1000,
          "sent": 800,
          "delivered": 750,
          "read": 300,
          "failed": 50
        },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "variantCount": 1,
        "firstVariantType": "text"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {
      "applied": {
        "page": 1,
        "limit": 20,
        "search": "",
        "status": "running"
      },
      "available": {
        "statuses": [
          "draft",
          "scheduled",
          "running",
          "paused",
          "completed",
          "failed"
        ],
        "campaignTypes": [
          "marketing",
          "transactional",
          "notification",
          "reminder",
          "other"
        ],
        "strategyModes": ["single", "ab", "multivariate"],
        "scheduleTypes": ["immediate", "scheduled", "delayed"],
        "sortableFields": [
          "name",
          "createdAt",
          "updatedAt",
          "scheduledDate",
          "metrics.totalRecipients",
          "metrics.sent",
          "metrics.delivered",
          "metrics.read",
          "metrics.failed"
        ]
      }
    },
    "counts": {
      "filtered": 100,
      "total": 150,
      "draft": 20,
      "scheduled": 15,
      "running": 30,
      "paused": 10,
      "completed": 70,
      "failed": 5
    }
  }
}
```

### Error Response (400)

```json
{
  "error": "Invalid minMetrics format. Expected JSON object.",
  "message": "minMetrics should be a valid JSON object with fields like: {sent: 10, delivered: 5}"
}
```

### Error Response (500)

```json
{
  "error": "Failed to get campaigns",
  "message": "Database connection error"
}
```

## Features

### Advanced Filtering

- **Status-based filtering**: Filter campaigns by their current status
- **Type-based filtering**: Filter by campaign type, strategy mode, or schedule type
- **Date range filtering**: Filter campaigns created within a specific date range
- **Recipients count filtering**: Filter by minimum/maximum number of recipients
- **Metrics filtering**: Filter by delivery metrics (sent, delivered, read, failed)

### Smart Search

- Searches across campaign name and description
- Case-insensitive matching
- Partial text matching

### Flexible Sorting

- Sort by any relevant field
- Support for both ascending and descending order
- Intelligent handling of date fields and metrics

### Performance Optimizations

- Aggregation pipeline for efficient querying
- Excludes heavy data (messageVariants) from results
- Computed fields for better sorting performance
- Proper indexing support

### Comprehensive Response

- Pagination information
- Applied filters summary
- Available filter options
- Status counts for dashboard statistics
- Campaign metadata without heavy content

## Notes

- The API automatically handles MongoDB ObjectId conversion
- All numeric parameters are validated and parsed
- Metrics filters support JSON string format for complex queries
- The response excludes `messageVariants` for performance but includes `variantCount`
- Date fields are properly handled for sorting and filtering
- Maximum limit is capped at 100 items per page for performance
