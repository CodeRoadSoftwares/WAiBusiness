import Div from "@/shared/components/Div";
import { TypeIcon } from "lucide-react";
import React, { useState } from "react";
import {
  MdSend,
  MdInfo,
  MdCode,
  MdCheckCircle,
  MdError,
  MdWarning,
} from "react-icons/md";
import { TbApi } from "react-icons/tb";

const Documentation = () => {
  const [activeEndpoint, setActiveEndpoint] = useState("send-direct-message");

  const endpoints = [
    {
      id: "send-direct-message",
      title: "Send Direct Message",
      description: "Send individual WhatsApp messages via API",
      icon: <MdSend />,
      method: "POST",
      path: "/api/messages/m",
      category: "Messages",
    },
    {
      id: "get-message-status",
      title: "Get Message Status",
      description: "Retrieve the status of a sent message",
      icon: <MdInfo />,
      method: "GET",
      path: "/api/messages/m/:messageId/status",
      category: "Messages",
    },
  ];

  const endpointDetails = {
    "send-direct-message": {
      title: "Send Direct Message",
      description:
        "Send individual WhatsApp messages directly to recipients using our API. This endpoint supports text, media, and mixed messages.",
      method: "POST",
      path: "/api/messages/m",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": "your_api_key_here",
      },
      requestBody: {
        phone: "string (required)",
        type: "string (required)",
        message: "string (optional)",
        media: "object (optional)",
        messageType: "string (optional)",
        priority: "string (optional)",
      },
      requestOptions: {
        type: [
          { value: "text", description: "Plain text message" },
          { value: "media", description: "Image, video, document, or audio" },
          { value: "mixed", description: "Media with text caption" },
        ],
        messageType: [
          {
            value: "notification",
            description: "General notifications (default)",
          },
          {
            value: "transactional",
            description: "Order confirmations, receipts",
          },
          { value: "reminder", description: "Appointment reminders" },
          { value: "promotional", description: "Marketing messages" },
          { value: "alert", description: "Urgent alerts" },
          { value: "update", description: "Status updates" },
        ],
        priority: [
          { value: "low", description: "Background processing" },
          { value: "normal", description: "Standard priority (default)" },
          { value: "high", description: "Processed faster" },
          { value: "urgent", description: "Immediate processing" },
        ],
      },
      examples: [
        {
          title: "Text Message",
          description: "Send a simple text message",
          code: `{
  "phone": "6005434120",
  "type": "text",
  "message": "Hello! This is a test message.",
  "messageType": "notification",
  "priority": "normal"
}`,
        },
        {
          title: "Media Message",
          description: "Send an image",
          code: `{
  "phone": "6005434120",
  "type": "media",
  "media": "https://picsum.photos/200/300",
  "messageType": "promotional",
  "priority": "normal"
}`,
        },
        {
          title: "Mixed Message",
          description: "Send any media with text caption",
          code: `{
  "phone": "6005434120",
  "type": "mixed",
  "message": "Here's your document:",
  "media": {
    "url": "https://example.com/document.pdf",
    "type": "document",
    "fileName": "report.pdf",
    "mimeType": "application/pdf"
  },
  "messageType": "transactional",
  "priority": "high"
}`,
        },
      ],
      response: {
        success: "boolean",
        message: "string",
        data: {
          success: "boolean",
          messageId: "string",
          status: "string",
          scheduledFor: "string",
          estimatedDelivery: "string",
          rateLimits: {
            messagesPerMinute: "number",
            delayBetweenMessages: "number",
          },
        },
      },
      responseOptions: {
        status_values: [
          { value: "pending", description: "Queued for sending" },
          { value: "sent", description: "Successfully sent to WhatsApp" },
        ],
        error_statuses: [
          { value: "failed", description: "Failed to send" },
          { value: "skipped", description: "Skipped due to rate limits" },
        ],
      },
      statusCodes: [
        {
          code: 200,
          description: "Message sent successfully",
          icon: <MdCheckCircle className="text-green-500" />,
        },
        {
          code: 400,
          description: "Bad request - Invalid parameters",
          icon: <MdError className="text-red-500" />,
        },
        {
          code: 401,
          description: "Unauthorized - Invalid API key",
          icon: <MdWarning className="text-yellow-500" />,
        },
        {
          code: 429,
          description: "Rate limit exceeded",
          icon: <MdWarning className="text-yellow-500" />,
        },
        {
          code: 500,
          description: "Internal server error",
          icon: <MdError className="text-red-500" />,
        },
      ],
    },
    "get-message-status": {
      title: "Get Message Status",
      description:
        "Retrieve the current status and details of a message that was sent via the API.",
      method: "GET",
      path: "/api/messages/m/:messageId/status",
      headers: {
        "X-API-Key": "your_api_key_here",
      },
      parameters: {
        messageId: "string (required) - The ID of the message to check",
      },
      response: {
        success: "boolean",
        data: {
          messageId: "string",
          status: "string",
          phone: "string",
          type: "string",
          message: "string",
          sentAt: "string",
          deliveredAt: "string",
          readAt: "string",
          lastError: "string",
          retries: "number",
          scheduledFor: "string",
          estimatedDelivery: "string",
        },
      },
      responseOptions: {
        status_values: [
          { value: "pending", description: "Queued for sending" },
          { value: "sent", description: "Successfully sent to WhatsApp" },
        ],
        error_statuses: [
          { value: "failed", description: "Failed to send" },
          { value: "skipped", description: "Skipped due to rate limits" },
        ],
      },
      statusCodes: [
        {
          code: 200,
          description: "Status retrieved successfully",
          icon: <MdCheckCircle className="text-green-500" />,
        },
        {
          code: 404,
          description: "Message not found",
          icon: <MdError className="text-red-500" />,
        },
        {
          code: 401,
          description: "Unauthorized - Invalid API key",
          icon: <MdWarning className="text-yellow-500" />,
        },
        {
          code: 500,
          description: "Internal server error",
          icon: <MdError className="text-red-500" />,
        },
      ],
    },
  };

  const activeEndpointData = endpointDetails[activeEndpoint];

  return (
    <div className="min-h-screen">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Div size="xl" className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <TbApi className="w-8 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                API Documentation
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Complete guide to using the WaiBusiness API
              </p>
            </div>
          </div>
        </Div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Endpoints
                </h2>
              </div>
              <div className="p-2">
                {endpoints.map((endpoint) => (
                  <button
                    key={endpoint.id}
                    onClick={() => setActiveEndpoint(endpoint.id)}
                    className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                      activeEndpoint === endpoint.id
                        ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-1.5 rounded ${
                          activeEndpoint === endpoint.id
                            ? "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {endpoint.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium ${
                              endpoint.method === "POST"
                                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                            }`}
                          >
                            {endpoint.method}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {endpoint.title}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {endpoint.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
                          {endpoint.path}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Endpoint Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    {activeEndpointData.icon || (
                      <TbApi className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {activeEndpointData.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {activeEndpointData.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      activeEndpointData.method === "POST"
                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                        : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                    }`}
                  >
                    {activeEndpointData.method}
                  </span>
                  <code className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
                    {activeEndpointData.path}
                  </code>
                </div>
              </div>

              {/* Request Details */}
              <div className="p-6">
                {/* Headers */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Headers
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <pre className="text-sm text-gray-800 dark:text-gray-200">
                      {Object.entries(activeEndpointData.headers).map(
                        ([key, value]) => (
                          <div key={key} className="flex">
                            <span className="text-blue-600 dark:text-blue-400 font-medium w-32">
                              {key}:
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {value}
                            </span>
                          </div>
                        )
                      )}
                    </pre>
                  </div>
                </div>

                {/* Request Body / Parameters */}
                {(activeEndpointData.requestBody ||
                  activeEndpointData.parameters) && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {activeEndpointData.requestBody
                        ? "Request Body"
                        : "Parameters"}
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <pre className="text-sm text-gray-800 dark:text-gray-200">
                        {activeEndpointData.requestBody
                          ? Object.entries(activeEndpointData.requestBody).map(
                              ([key, value]) => (
                                <div key={key} className="flex">
                                  <span className="text-blue-600 dark:text-blue-400 font-medium w-32">
                                    {key}:
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {value}
                                  </span>
                                </div>
                              )
                            )
                          : Object.entries(activeEndpointData.parameters).map(
                              ([key, value]) => (
                                <div key={key} className="flex">
                                  <span className="text-blue-600 dark:text-blue-400 font-medium w-32">
                                    {key}:
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {value}
                                  </span>
                                </div>
                              )
                            )}
                      </pre>
                    </div>

                    {/* Request Options */}
                    {activeEndpointData.requestOptions && (
                      <div className="mt-6">
                        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                          Available Options
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {activeEndpointData.requestOptions.type && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                                type
                              </h5>
                              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                {activeEndpointData.requestOptions.type.map(
                                  (option, index) => (
                                    <li key={index}>
                                      <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                        {option.value}
                                      </code>{" "}
                                      - {option.description}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                          {activeEndpointData.requestOptions.messageType && (
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                                messageType
                              </h5>
                              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                {activeEndpointData.requestOptions.messageType.map(
                                  (option, index) => (
                                    <li key={index}>
                                      <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                        {option.value}
                                      </code>{" "}
                                      - {option.description}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                          {activeEndpointData.requestOptions.priority && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                                priority
                              </h5>
                              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                {activeEndpointData.requestOptions.priority.map(
                                  (option, index) => (
                                    <li key={index}>
                                      <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                        {option.value}
                                      </code>{" "}
                                      - {option.description}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Examples */}
                {activeEndpointData.examples && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Examples
                    </h3>
                    <div className="space-y-6">
                      {activeEndpointData.examples.map((example, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {example.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {example.description}
                            </p>
                          </div>
                          <div className="p-4">
                            <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
                              <code>{example.code}</code>
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Response */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Response
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <pre className="text-sm text-gray-800 dark:text-gray-200">
                      {Object.entries(activeEndpointData.response).map(
                        ([key, value]) => (
                          <div key={key}>
                            <div className="flex">
                              <span className="text-green-600 dark:text-green-400 font-medium mr-2">
                                {key}:
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {typeof value === "object" ? "object" : value}
                              </span>
                            </div>
                            {typeof value === "object" && value !== null && (
                              <div className="ml-8 mt-1">
                                {Object.entries(value).map(
                                  ([subKey, subValue]) => (
                                    <div key={subKey}>
                                      <div className="flex">
                                        <span className="text-blue-600 dark:text-blue-400 font-medium mr-2">
                                          {subKey}:
                                        </span>
                                        <span className="text-gray-600 dark:text-gray-400">
                                          {typeof subValue === "object"
                                            ? "object"
                                            : subValue}
                                        </span>
                                      </div>
                                      {typeof subValue === "object" &&
                                        subValue !== null && (
                                          <div className="ml-6 mt-1">
                                            {Object.entries(subValue).map(
                                              ([nestedKey, nestedValue]) => (
                                                <div
                                                  key={nestedKey}
                                                  className="flex"
                                                >
                                                  <span className="text-purple-600 dark:text-purple-400 font-medium mr-2">
                                                    {nestedKey}:
                                                  </span>
                                                  <span className="text-gray-600 dark:text-gray-400">
                                                    {nestedValue}
                                                  </span>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </pre>
                  </div>

                  {/* Response Options */}
                  {activeEndpointData.responseOptions && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                        Status Meanings
                      </h4>
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {activeEndpointData.responseOptions.status_values && (
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                                Status Values
                              </h5>
                              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                {activeEndpointData.responseOptions.status_values.map(
                                  (option, index) => (
                                    <li key={index}>
                                      <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                        {option.value}
                                      </code>{" "}
                                      - {option.description}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                          {activeEndpointData.responseOptions
                            .error_statuses && (
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                                Error Statuses
                              </h5>
                              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                {activeEndpointData.responseOptions.error_statuses.map(
                                  (option, index) => (
                                    <li key={index}>
                                      <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                        {option.value}
                                      </code>{" "}
                                      - {option.description}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Codes */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Status Codes
                  </h3>
                  <div className="space-y-2">
                    {activeEndpointData.statusCodes.map((status, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                      >
                        <span className="text-lg">{status.icon}</span>
                        <code className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm font-mono">
                          {status.code}
                        </code>
                        <span className="text-gray-700 dark:text-gray-300">
                          {status.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
