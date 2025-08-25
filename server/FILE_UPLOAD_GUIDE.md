# File Upload and Audience Processing Guide

## Overview

This system handles two types of file uploads for campaign creation:

1. **Media Files** - Stored permanently in `uploads/media/` folder
2. **Audience Files** - Processed in memory and discarded (CSV/Excel files)

## Audience File Structure

The audience file should have a header row with column names that match the `availableMergeFields` from your frontend form.

### Example CSV Structure:

```csv
ID,Name,Email Id,Password,Send Email,Phone Number
1,John Doe,john@example.com,pass123,true,9876543210
2,Jane Smith,jane@example.com,pass456,false,9876543211
```

### Example Excel Structure:

Same as CSV but in Excel format (.xlsx or .xls)

## Frontend Integration

### 1. Send Campaign Data with Files

```javascript
// Create FormData object
const formData = new FormData();

// Add campaign data
formData.append("name", "My Campaign");
formData.append("campaignType", "bulk");
formData.append("messageType", "text");
formData.append("messageContent", "Hello {{name}}!");
formData.append("audienceType", "upload");

// Add availableMergeFields (this is crucial!)
formData.append(
  "availableMergeFields",
  JSON.stringify([
    {
      field: "id",
      label: "ID",
      required: false,
    },
    {
      field: "name",
      label: "Name",
      required: false,
    },
    {
      field: "emailid",
      label: "Email Id",
      required: false,
    },
    {
      field: "password",
      label: "Password",
      required: false,
    },
    {
      field: "sendemail",
      label: "Send Email",
      required: false,
    },
    {
      field: "phonenumber",
      label: "Phone Number",
      required: true, // This identifies the phone column!
    },
  ])
);

// Add files
if (mediaFile) {
  formData.append("mediaFile", mediaFile);
}
if (audienceFile) {
  formData.append("audienceFile", audienceFile);
}

// Send request
const response = await fetch("/api/whatsapp/campaigns/create", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

### 2. Response Structure

After processing, your audience data will look like this:

```json
{
  "success": true,
  "message": "Campaign created successfully",
  "data": {
    "campaign": {
      /* campaign data */
    },
    "audienceStats": {
      "totalRows": 2,
      "uniquePhones": 2,
      "duplicates": 0,
      "duplicatePercentage": "0.00",
      "variablesCount": 5
    }
  }
}
```

The `campaign.audience.audience` will contain:

```json
[
  {
    "phone": "919876543210",
    "variables": {
      "id": "1",
      "name": "John Doe",
      "emailid": "john@example.com",
      "password": "pass123",
      "sendemail": "true"
    }
  },
  {
    "phone": "919876543211",
    "variables": {
      "id": "2",
      "name": "Jane Smith",
      "emailid": "jane@example.com",
      "password": "pass456",
      "sendemail": "false"
    }
  }
]
```

## Key Points

### 1. Phone Column Detection

- The system automatically detects the phone column by looking for the field with `required: true` in `availableMergeFields`
- It matches both the `label` and `field` properties

### 2. Variables Mapping

- All columns except the phone column become variables
- Variable names use the `field` property from `availableMergeFields`
- If no exact match is found, the header is sanitized and used as-is

### 3. Phone Number Validation

- Automatically cleans and formats phone numbers
- Assumes +91 country code (India)
- Converts formats like: 9876543210 → 919876543210

### 4. File Requirements

- **CSV/Excel**: Must have header row + at least one data row
- **Media Files**: Supported formats: images, videos, audio, PDFs
- **Size Limits**: Media: 10MB, Audience: 5MB

## Testing

Use the test endpoint to verify file uploads:

```bash
POST /api/whatsapp/test-upload
```

This will process your files and show you exactly how the data will be structured without creating a campaign.

## Error Handling

Common errors and solutions:

1. **"Phone column not found"** - Check that your CSV/Excel headers match the labels in `availableMergeFields`
2. **"No required phone field found"** - Ensure one field has `required: true` in `availableMergeFields`
3. **"File type not allowed"** - Check file format and size limits
4. **"Valid audience data is required"** - Ensure phone numbers are valid and file has data rows

## Example Frontend Form

```jsx
const [availableMergeFields, setAvailableMergeFields] = useState([
  { field: "name", label: "Name", required: false },
  { field: "email", label: "Email", required: false },
  { field: "phone", label: "Phone Number", required: true },
]);

const handleSubmit = async (formData) => {
  const data = new FormData();

  // Add all form fields
  Object.keys(formData).forEach((key) => {
    if (key === "availableMergeFields") {
      data.append(key, JSON.stringify(availableMergeFields));
    } else {
      data.append(key, formData[key]);
    }
  });

  // Add files
  if (formData.mediaFile) {
    data.append("mediaFile", formData.mediaFile);
  }
  if (formData.audienceFile) {
    data.append("audienceFile", formData.audienceFile);
  }

  // Submit
  const response = await fetch("/api/whatsapp/campaigns/create", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: data,
  });
};
```
