import React, { useState } from "react";
import {
  FileText,
  Users,
  Phone,
  Video as VideoIcon,
  MoreVertical,
  ArrowLeft,
} from "lucide-react";
import { PiStickerBold } from "react-icons/pi";
import { GrAttachment } from "react-icons/gr";
import { MdOutlinePhotoCamera } from "react-icons/md";
import { BiSolidSend } from "react-icons/bi";

const WhatsAppPreview = ({
  // Header props
  contactName = "Contact",
  contactStatus = "online",
  contactAvatar = null,
  contactInitial = "C",

  // System messages (array of objects with type, content, icon)
  systemMessages = [],

  // Main message props
  messageType = "text", // text, media, mixed, template
  messageContent = "",
  mediaFile = null,

  // Default message when no content is provided
  defaultMessage = "Start building your content to see the preview here...",

  // Layout props
  height = "600px",
  showInputArea = true,
  showHeader = true,

  // Custom styling
  className = "",

  // Additional features
  showMergeFields = false,
  mergeFields = [],
  audienceCount = 0,
}) => {
  const [expandedMessages, setExpandedMessages] = useState(new Set());

  const toggleMessageExpansion = (messageId) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // Function to replace merge fields with sample data
  const getPreviewMessage = (message) => {
    if (!message || !mergeFields.length || !showMergeFields) return message;

    let previewMessage = message;

    // Replace merge fields with sample data
    mergeFields.forEach((mergeFieldObj) => {
      const { field, label, sampleValue } = mergeFieldObj;

      // Support both {{field}} and {{label}} formats
      const fieldMerge = `{{${field}}}`;
      const labelMerge = `{{${label}}}`;

      const value = sampleValue || `Sample ${label}`;

      // Replace both formats
      previewMessage = previewMessage.replace(
        new RegExp(fieldMerge, "gi"),
        value
      );
      previewMessage = previewMessage.replace(
        new RegExp(labelMerge, "gi"),
        value
      );
    });

    return previewMessage;
  };

  const renderSystemMessage = (message, index) => {
    const { content, icon: Icon, variant = "default" } = message;

    const variants = {
      info: "bg-[#fff1de] dark:bg-gray-600",
      default: "bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300",
      warning: "bg-yellow-50 dark:bg-yellow-900/20",
      success: "bg-green-50 dark:bg-green-900/20",
      error: "bg-red-50 dark:bg-red-900/20",
    };

    return (
      <div key={index} className="flex justify-center">
        <div
          className={`${variants[variant]} rounded-md shadow-sm font-semibold px-4 py-2 max-w-[80%] text-center gap-2`}
        >
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {Icon && <Icon className="-mt-1 mr-1 w-3 h-3 inline" />}
            {content}
          </p>
        </div>
      </div>
    );
  };

  const renderMediaContent = (file) => {
    if (!file) return null;

    if (file.type.startsWith("image/")) {
      return (
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="w-full h-auto max-h-64 object-cover rounded-md"
        />
      );
    } else if (file.type.startsWith("video/")) {
      return (
        <video
          src={URL.createObjectURL(file)}
          controls
          className="w-full h-auto max-h-64 object-cover rounded-md"
        />
      );
    } else if (file.type.startsWith("audio/")) {
      return (
        <div className="p-3 bg-gray-50 dark:bg-gray-100 rounded-md">
          <audio src={URL.createObjectURL(file)} controls className="w-full" />
        </div>
      );
    } else {
      return (
        <div className="p-3 bg-gray-50 dark:bg-gray-100 rounded-md">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-gray-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {file.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderMainMessage = () => {
    const hasMedia = mediaFile instanceof File;
    const hasText = messageContent && messageContent.trim() !== "";

    // If no content at all, show default message
    if (!hasMedia && !hasText) {
      return (
        <div className="flex justify-start">
          <div className="max-w-[75%] bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm relative border border-wa-border-light dark:border-wa-border-dark">
            <div className="absolute -top-1 -left-1 w-0 h-0 border-l-[8px] border-l-transparent border-b-[8px] border-b-white rotate-45"></div>
            <div className="text-sm text-gray-800">
              <p className="whitespace-pre-line">{defaultMessage}</p>
            </div>
            <div className="flex items-center justify-end mt-1">
              <span className="text-xs text-gray-400">12:34 PM</span>
            </div>
          </div>
        </div>
      );
    }

    // Media-only message
    if (messageType === "media") {
      if (hasMedia) {
        return (
          <div className="flex justify-start">
            <div className="max-w-[75%] bg-white rounded-lg rounded-bl-none shadow-sm relative border border-wa-border-light dark:border-wa-border-dark">
              <div className="absolute -bottom-1.5 -left-1 w-0 h-0 border-l-[12px] border-l-transparent border-b-[12px] border-b-white rotate-[225deg]"></div>
              <div className="p-1 rounded-lg">
                {renderMediaContent(mediaFile)}
              </div>
              <div className="flex items-center justify-end px-3 py-1">
                <span className="text-xs text-gray-400">12:34 PM</span>
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex justify-start">
            <div className="max-w-[75%] bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm relative border border-wa-border-light dark:border-wa-border-dark">
              <div className="absolute -top-1 -left-1 w-0 h-0 border-l-[8px] border-l-transparent border-b-[8px] border-b-white rotate-45"></div>
              <div className="text-sm text-gray-800">
                <p className="whitespace-pre-line">{defaultMessage}</p>
              </div>
              <div className="flex items-center justify-end mt-1">
                <span className="text-xs text-gray-400">12:34 PM</span>
              </div>
            </div>
          </div>
        );
      }
    }

    // Mixed content: media + text
    if (messageType === "mixed") {
      if (hasMedia && hasText) {
        return (
          <div className="flex justify-start">
            <div className="max-w-[75%] bg-white rounded-lg rounded-bl-none shadow-sm relative border border-wa-border-light dark:border-wa-border-dark">
              <div className="absolute -bottom-1.5 -left-1 w-0 h-0 border-l-[12px] border-l-transparent border-b-[12px] border-b-white rotate-[225deg]"></div>

              {/* Media Content */}
              <div className="p-1 rounded-lg">
                {renderMediaContent(mediaFile)}
              </div>

              {/* Text Caption */}
              <div className="px-3 py-2">
                <div className="text-sm text-gray-800">
                  {(() => {
                    const message = getPreviewMessage(messageContent);
                    const lines = message.split("\n").length;
                    const chars = message.length;
                    const shouldShowReadMore =
                      lines > 10 || (lines <= 10 && chars > 100);

                    if (shouldShowReadMore) {
                      let truncatedMessage = message;
                      if (lines > 10) {
                        truncatedMessage = message
                          .split("\n")
                          .slice(0, 10)
                          .join("\n");
                      } else if (chars > 100) {
                        truncatedMessage = message.substring(0, 100);
                      }

                      return (
                        <>
                          <p className="whitespace-pre-line break-words break-all">
                            {expandedMessages.has("main")
                              ? message
                              : truncatedMessage + "..."}
                          </p>
                          <button
                            onClick={() => toggleMessageExpansion("main")}
                            className="text-wa-brand hover:text-wa-brand/80 text-xs font-medium mt-1"
                          >
                            {expandedMessages.has("main")
                              ? "Read Less"
                              : "Read More"}
                          </button>
                        </>
                      );
                    } else {
                      return (
                        <p className="whitespace-pre-line break-words break-all">
                          {message}
                        </p>
                      );
                    }
                  })()}
                </div>
              </div>

              <div className="flex items-center justify-end px-3 py-1">
                <span className="text-xs text-gray-400">12:34 PM</span>
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex justify-start">
            <div className="max-w-[75%] bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm relative border border-wa-border-light dark:border-wa-border-dark">
              <div className="absolute -top-1 -left-1 w-0 h-0 border-l-[8px] border-l-transparent border-b-[8px] border-b-white rotate-45"></div>
              <div className="text-sm text-gray-800">
                <p className="whitespace-pre-line">{defaultMessage}</p>
              </div>
              <div className="flex items-center justify-end mt-1">
                <span className="text-xs text-gray-400">12:34 PM</span>
              </div>
            </div>
          </div>
        );
      }
    }

    // Text-only message
    if (hasText) {
      return (
        <div className="flex justify-start">
          <div className="max-w-[75%] bg-white rounded-lg rounded-bl-none px-3 py-2 shadow-sm relative border border-wa-border-light dark:border-wa-border-dark">
            <div className="absolute -bottom-1 -left-1 w-0 h-0 border-l-[8px] border-l-transparent border-b-[8px] border-b-white rotate-[225deg]"></div>
            <div className="text-sm text-gray-800">
              {(() => {
                const message = getPreviewMessage(messageContent);
                const lines = message.split("\n").length;
                const chars = message.length;
                const shouldShowReadMore =
                  lines > 10 || (lines <= 10 && chars > 500);

                if (shouldShowReadMore) {
                  let truncatedMessage = message;
                  if (lines > 10) {
                    truncatedMessage = message
                      .split("\n")
                      .slice(0, 10)
                      .join("\n");
                  } else if (chars > 500) {
                    truncatedMessage = message.substring(0, 500);
                  }

                  return (
                    <>
                      <p className="whitespace-pre-line break-words break-all">
                        {expandedMessages.has("main")
                          ? message
                          : truncatedMessage + "..."}
                      </p>
                      <button
                        onClick={() => toggleMessageExpansion("main")}
                        className="text-wa-brand hover:text-wa-brand/80 text-xs font-medium mt-1"
                      >
                        {expandedMessages.has("main")
                          ? "Read Less"
                          : "Read More"}
                      </button>
                    </>
                  );
                } else {
                  return (
                    <p className="whitespace-pre-line break-words break-all">
                      {message}
                    </p>
                  );
                }
              })()}
            </div>
            <div className="flex items-center justify-end mt-1">
              <span className="text-xs text-gray-400">12:34 PM</span>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex justify-start">
          <div className="max-w-[75%] bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm relative border border-wa-border-light dark:border-wa-border-dark">
            <div className="absolute -top-1 -left-1 w-0 h-0 border-l-[8px] border-l-transparent border-b-[8px] border-b-white rotate-45"></div>
            <div className="text-sm text-gray-800">
              <p className="whitespace-pre-line">{defaultMessage}</p>
            </div>
            <div className="flex items-center justify-end mt-1">
              <span className="text-xs text-gray-400">12:34 PM</span>
            </div>
          </div>
        </div>
      );
    }
  };

  // Add audience count system message if provided
  const allSystemMessages = [...systemMessages];
  if (audienceCount > 0) {
    allSystemMessages.push({
      type: "info",
      content: `Message will be sent to ${audienceCount} contacts`,
      icon: Users,
      variant: "info",
    });
  }

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden ${className}`}
    >
      {/* WhatsApp Header */}
      {showHeader && (
        <div className="bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            {/* Back Button */}
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />

            {/* Profile Picture */}
            <div className="w-10 h-10 bg-wa-brand/25 rounded-full flex items-center justify-center mx-2">
              {contactAvatar ? (
                <img
                  src={contactAvatar}
                  alt={contactName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-wa-brand font-semibold text-lg">
                  {contactInitial}
                </span>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h3 className="text-gray-900 dark:text-gray-100 font-medium">
                {contactName}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm -mt-1">
                {contactStatus}
              </p>
            </div>

            {/* Action Icons */}
            <div className="flex items-center space-x-3">
              <VideoIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Chat and Input Area */}
      <div className="bg-transparent relative">
        {/* Background Image */}
        <div className="absolute inset-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url("/chat-bg.jpg")`,
            }}
          ></div>
        </div>

        {/* Chat Background */}
        <div
          className={`relative overflow-y-auto px-3 py-4 space-y-3`}
          style={{ height }}
        >
          {/* System Messages */}
          {allSystemMessages.map((message, index) =>
            renderSystemMessage(message, index)
          )}

          {/* Main Message */}
          {renderMainMessage()}
        </div>

        {/* Message Input Area */}
        {showInputArea && (
          <div className="px-2 py-3 relative z-10">
            <div className="flex items-center gap-1">
              <div className="flex-1 bg-white dark:bg-gray-700 rounded-full px-3 py-2 flex items-center">
                <PiStickerBold className="w-6 h-6 text-gray-600" />
                <div className="ml-2 flex-1 flex items-center">
                  <div className="w-0.5 h-5 bg-wa-brand dark:bg-gray-200 animate-pulse"></div>
                  <input
                    type="text"
                    placeholder="Message"
                    className="flex-1 bg-transparent text-gray-900 dark:text-gray-200 outline-none placeholder:text-gray-500"
                    disabled
                  />
                </div>
                <div className="flex gap-2 items-end justify-end space-x-1 text-gray-600">
                  <GrAttachment className="-rotate-[45deg] w-5 h-5" />
                  <MdOutlinePhotoCamera className="w-6 h-6 -mb-1" />
                </div>
              </div>
              <span className="bg-wa-brand p-2 rounded-full text-white">
                <BiSolidSend className="w-5 h-5" />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppPreview;
