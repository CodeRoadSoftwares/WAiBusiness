# WhatsAppPreview Component

A reusable WhatsApp-style chat preview component that can be used across different parts of the application to show how messages will appear in WhatsApp.

## Features

- **Realistic WhatsApp UI**: Mimics the actual WhatsApp interface with header, chat area, and input field
- **Multiple Message Types**: Supports text, media, mixed content, and templates
- **System Messages**: Configurable system messages with different variants (info, warning, success, error)
- **Merge Fields**: Preview merge fields with sample data (e.g., {{name}} → "John Doe")
- **Responsive Design**: Adapts to different screen sizes and heights
- **Customizable**: Extensive props for different use cases

## Props

### Header Props

- `contactName` (string): Name displayed in the header
- `contactStatus` (string): Status text (e.g., "online", "template")
- `contactAvatar` (string): URL to contact avatar image
- `contactInitial` (string): Initial letter for avatar fallback

### System Messages

- `systemMessages` (array): Array of system message objects
  ```jsx
  {
    type: "info",           // Optional: message type
    content: "Message text", // Required: message content
    icon: LockKeyhole,      // Optional: icon component
    variant: "default"      // Optional: "default", "info", "warning", "success", "error"
  }
  ```

### Message Props

- `messageType` (string): "text", "media", "mixed", "template"
- `messageContent` (string): Text content of the message
- `mediaFile` (File): Media file for media/mixed messages
- `defaultMessage` (string): Message shown when no content is provided

### Layout Props

- `height` (string): Height of the chat area (e.g., "600px", "400px")
- `showInputArea` (boolean): Whether to show the message input area
- `showHeader` (boolean): Whether to show the contact header

### Advanced Features

- `showMergeFields` (boolean): Enable merge field preview
- `mergeFields` (array): Array of merge field objects
  ```jsx
  {
    field: "name",           // Field identifier
    label: "Full Name",      // Human-readable label
    sampleValue: "John Doe"  // Sample value for preview
  }
  ```
- `audienceCount` (number): Number of contacts the message will be sent to

### Styling

- `className` (string): Additional CSS classes

## Usage Examples

### Basic Template Preview

```jsx
<WhatsAppPreview
  contactName="Template Preview"
  contactStatus="template"
  contactInitial="T"
  systemMessages={[
    {
      content: "Template Preview",
      icon: Eye,
      variant: "default",
    },
  ]}
  messageType={formData.type}
  messageContent={formData.text}
  mediaFile={formData.mediaFile}
  defaultMessage="Start building your template to see the preview here..."
  height="400px"
/>
```

### Campaign Preview with Merge Fields

```jsx
<WhatsAppPreview
  contactName={authData?.user?.name || "User"}
  contactStatus="online"
  contactInitial={authData?.user?.name?.charAt(0)?.toUpperCase() || "U"}
  systemMessages={[
    {
      content: "Today",
      variant: "default",
    },
    {
      content: "Messages and calls are end-to-end encrypted...",
      icon: LockKeyhole,
      variant: "default",
    },
  ]}
  messageType={formData.messageType}
  messageContent={formData.messageContent}
  mediaFile={formData.mediaFile}
  defaultMessage="Start building your campaign to see the message here..."
  height="600px"
  showMergeFields={true}
  mergeFields={formData.availableMergeFields.map((field) => ({
    field: field.field,
    label: field.label,
    sampleValue: `Sample ${field.label}`,
  }))}
  audienceCount={formData.audienceContactCount}
/>
```

### Minimal Preview (No Header/Input)

```jsx
<WhatsAppPreview
  messageType="text"
  messageContent="Hello {{name}}, welcome to our service!"
  showHeader={false}
  showInputArea={false}
  height="300px"
  showMergeFields={true}
  mergeFields={[{ field: "name", label: "Name", sampleValue: "John" }]}
/>
```

## Message Type Support

### Text Messages

- Plain text with support for line breaks
- Automatic "Read More" for long messages
- Merge field replacement

### Media Messages

- Images, videos, audio, and documents
- File size display
- Proper media controls

### Mixed Messages

- Media with text caption
- Combined preview of both content types

## System Message Variants

- **default**: Beige background (default WhatsApp style)
- **info**: Blue background
- **warning**: Yellow background
- **success**: Green background
- **error**: Red background

## Merge Fields

The component automatically replaces merge fields in the format `{{fieldName}}` with sample values. This is useful for:

- Campaign previews
- Template testing
- Personalization preview

## Styling

The component uses Tailwind CSS classes and follows the project's WhatsApp-inspired design system. All colors and spacing are consistent with the rest of the application.

## Accessibility

- Proper ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly structure
- High contrast support through dark mode
