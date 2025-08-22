import React from "react";
import {
  MessageSquare,
  FileText,
  Plus,
  X,
  Search,
  Upload,
  Image,
  FileText as TemplateIcon,
  Layers,
  MessageSquareText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const MessageContentSection = ({
  formData,
  onFormChange,
  abTestingEnabled = false,
}) => {
  const handleMessageTypeChange = (value) => {
    console.log("Message type changed to:", value);
    onFormChange("messageType", value);
  };

  const handleMessageContentChange = (value, variantIndex = 0) => {
    console.log(
      "Message content changed:",
      value,
      "for variant:",
      variantIndex
    );
    if (abTestingEnabled) {
      const updatedVariants = [...(formData.messageVariants || [])];
      updatedVariants[variantIndex] = {
        ...updatedVariants[variantIndex],
        content: value,
      };
      onFormChange("messageVariants", updatedVariants);
    } else {
      onFormChange("messageContent", value);
    }
  };

  const handleFileUpload = (file, variantIndex = 0) => {
    console.log("File uploaded:", file, "for variant:", variantIndex);
    if (abTestingEnabled) {
      const updatedVariants = [...(formData.messageVariants || [])];
      updatedVariants[variantIndex] = {
        ...updatedVariants[variantIndex],
        mediaFile: file,
      };
      onFormChange("messageVariants", updatedVariants);
    } else {
      onFormChange("mediaFile", file);
    }
  };

  const handleTemplateSelection = (templateId, variantIndex = 0) => {
    if (abTestingEnabled) {
      const updatedVariants = [...(formData.messageVariants || [])];
      updatedVariants[variantIndex] = {
        ...updatedVariants[variantIndex],
        templateId: templateId,
      };
      onFormChange("messageVariants", updatedVariants);
    } else {
      onFormChange("templateId", templateId);
    }
  };

  const renderTextMessageForm = (variantIndex = 0) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
          <MessageSquareText className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
          Message<span className="text-red-500 ml-1">*</span>
        </label>
        <Textarea
          placeholder="Enter your message content..."
          value={
            abTestingEnabled
              ? formData.messageVariants?.[variantIndex]?.content || ""
              : formData.messageContent || ""
          }
          onChange={(e) =>
            handleMessageContentChange(e.target.value, variantIndex)
          }
          className="w-full min-h-[120px]"
          required
        />

        {/* Show available merge fields if audience is selected */}
        {formData.availableMergeFields &&
          formData.availableMergeFields.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Available variables for personalization:
                </span>
                <span className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  {formData.availableMergeFields.length} fields
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.availableMergeFields.map((field, index) => {
                  // Check if this field is already in the message content
                  const fieldValue = `{{${field.field}}}`;
                  const currentContent = formData.messageContent || "";
                  const isInserted = currentContent.includes(fieldValue);

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector(
                          `textarea[placeholder="Enter your message content..."]`
                        );
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const after = text.substring(end);
                          const newText = before + fieldValue + after;

                          // Update the textarea value
                          textarea.value = newText;

                          // Update the form state immediately for visual feedback
                          onFormChange("messageContent", newText);

                          // Set cursor position after the inserted variable
                          const newPosition = start + fieldValue.length;
                          textarea.setSelectionRange(newPosition, newPosition);
                          textarea.focus();
                        }
                      }}
                      className={`px-3 py-1 text-sm rounded-full border transition-all duration-200 font-medium ${
                        isInserted
                          ? "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-default opacity-60"
                          : "bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-wa-brand/10 dark:hover:bg-wa-brand/20 hover:border-wa-brand dark:hover:border-wa-brand shadow-sm"
                      }`}
                      title={`Click to insert ${fieldValue} - ${field.label}`}
                    >
                      {field.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                Click any variable above to insert it into your message. Dimmed
                fields are already inserted but can be added again.
              </p>
            </div>
          )}
      </div>
    </div>
  );

  const renderMediaMessageForm = (variantIndex = 0) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
          <Upload className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
          File<span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <input
            type="file"
            id={`media-upload-${variantIndex}`}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                handleFileUpload(file, variantIndex);
              }
            }}
          />
          <label
            htmlFor={`media-upload-${variantIndex}`}
            className="border-2 border-dashed border-wa-border-light dark:border-wa-border-dark rounded-lg p-6 text-center hover:border-wa-brand/50 transition-colors cursor-pointer block"
          >
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-wa-icon-light dark:text-wa-icon-dark" />
              <p className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                Supports: Images, Videos, Audio, Documents
              </p>
            </div>
          </label>
        </div>
        {/* Show selected file if any */}
        {((abTestingEnabled &&
          formData.messageVariants?.[variantIndex]?.mediaFile) ||
          (!abTestingEnabled && formData.mediaFile)) && (
          <div className="bg-wa-brand/5 dark:bg-wa-brand/10 p-3 rounded-lg border border-wa-brand/20">
            <p className="text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
              Selected:{" "}
              {abTestingEnabled
                ? formData.messageVariants?.[variantIndex]?.mediaFile?.name
                : formData.mediaFile?.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderTemplateMessageForm = (variantIndex = 0) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
          <FileText className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
          Select Template <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="space-y-3">
          {/* Template Selection with Search */}
          <Select
            value={
              abTestingEnabled
                ? formData.messageVariants?.[variantIndex]?.templateId || ""
                : formData.templateId || ""
            }
            onValueChange={(value) =>
              handleTemplateSelection(value, variantIndex)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Search and select a template" />
            </SelectTrigger>
            <SelectContent>
              <div className="p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    className="pl-8"
                    onChange={(e) => {
                      // TODO: Implement search functionality
                      console.log("Searching for:", e.target.value);
                    }}
                  />
                </div>
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                {/* Template options will be dynamically inserted here */}
                <SelectItem value="template1">
                  Welcome Message Template
                </SelectItem>
                <SelectItem value="template2">
                  Promotional Offer Template
                </SelectItem>
                <SelectItem value="template3">
                  Order Confirmation Template
                </SelectItem>
                <SelectItem value="template4">
                  Customer Support Template
                </SelectItem>
                <SelectItem value="template5">Newsletter Template</SelectItem>
              </div>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderMixedContentForm = (variantIndex = 0) => (
    <div className="space-y-6">
      {/* Text Content */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
          <MessageSquareText className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
          Message<span className="text-red-500 ml-1">*</span>
        </label>
        <Textarea
          placeholder="Enter your message content..."
          value={
            abTestingEnabled
              ? formData.messageVariants?.[variantIndex]?.content || ""
              : formData.messageContent || ""
          }
          onChange={(e) =>
            handleMessageContentChange(e.target.value, variantIndex)
          }
          className="w-full min-h-[100px]"
          required
        />

        {/* Show available merge fields if audience is selected */}
        {formData.availableMergeFields &&
          formData.availableMergeFields.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Available variables for personalization:
                </span>
                <span className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  {formData.availableMergeFields.length} fields
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.availableMergeFields.map((field, index) => {
                  // Check if this field is already in the message content
                  const fieldValue = `{{${field.field}}}`;
                  const currentContent = formData.messageContent || "";
                  const isInserted = currentContent.includes(fieldValue);

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector(
                          `textarea[placeholder="Enter your message content..."]`
                        );
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const after = text.substring(end);
                          const newText = before + fieldValue + after;

                          // Update the textarea value
                          textarea.value = newText;

                          // Update the form state immediately for visual feedback
                          onFormChange("messageContent", newText);

                          // Set cursor position after the inserted variable
                          const newPosition = start + fieldValue.length;
                          textarea.setSelectionRange(newPosition, newPosition);
                          textarea.focus();
                        }
                      }}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 font-medium ${
                        isInserted
                          ? "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                          : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
                      }`}
                      title={`Click to insert ${fieldValue} - ${field.label}`}
                    >
                      {field.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                Click any variable above to insert it into your message. Dimmed
                fields are already inserted but can be added again.
              </p>
            </div>
          )}
      </div>

      {/* Media Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
          <Upload className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
          File<span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <input
            type="file"
            id={`mixed-media-upload-${variantIndex}`}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                handleFileUpload(file, variantIndex);
              }
            }}
          />
          <label
            htmlFor={`mixed-media-upload-${variantIndex}`}
            className="border-2 border-dashed border-wa-border-light dark:border-wa-border-dark rounded-lg p-6 text-center hover:border-wa-brand/50 transition-colors cursor-pointer block"
          >
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-wa-icon-light dark:text-wa-icon-dark" />
              <p className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                Supports: Images, Videos, Audio, Documents
              </p>
            </div>
          </label>
        </div>
        {/* Show selected file if any */}
        {((abTestingEnabled &&
          formData.messageVariants?.[variantIndex]?.mediaFile) ||
          (!abTestingEnabled && formData.mediaFile)) && (
          <div className="bg-wa-brand/5 dark:bg-wa-brand/10 p-3 rounded-lg border border-wa-brand/20">
            <p className="text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
              Selected:{" "}
              {abTestingEnabled
                ? formData.messageVariants?.[variantIndex]?.mediaFile?.name
                : formData.mediaFile?.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderMessageContentByType = (messageType, variantIndex = 0) => {
    switch (messageType) {
      case "text":
        return renderTextMessageForm(variantIndex);
      case "media":
        return renderMediaMessageForm(variantIndex);
      case "template":
        return renderTemplateMessageForm(variantIndex);
      case "mixed":
        return renderMixedContentForm(variantIndex);
      default:
        return renderTextMessageForm(variantIndex);
    }
  };

  const renderSingleMessageForm = () => (
    <div className="space-y-6">
      {/* Message Type Selection with Enhanced Radio Buttons */}
      <div className="space-y-4">
        <RadioGroup
          value={formData.messageType || "text"}
          onValueChange={handleMessageTypeChange}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {/* Text Message */}
          <div className="group relative">
            <RadioGroupItem value="text" id="text" className="sr-only" />
            <Label
              htmlFor="text"
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                formData.messageType === "text"
                  ? "border-wa-brand bg-wa-brand/5 dark:bg-wa-brand/10 shadow-sm"
                  : "border-wa-border-light dark:border-wa-border-dark hover:border-wa-brand/30 hover:bg-wa-brand/5 dark:hover:bg-wa-brand/10"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-200 ${
                  formData.messageType === "text"
                    ? "bg-wa-brand text-white"
                    : "bg-wa-brand/10 text-wa-brand"
                }`}
              >
                <MessageSquareText className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  Text
                </div>
                <div className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Send text message to your audience
                </div>
              </div>
            </Label>
          </div>

          {/* Media Message */}
          <div className="group relative">
            <RadioGroupItem value="media" id="media" className="sr-only" />
            <Label
              htmlFor="media"
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                formData.messageType === "media"
                  ? "border-wa-brand bg-wa-brand/5 dark:bg-wa-brand/10 shadow-sm"
                  : "border-wa-border-light dark:border-wa-border-dark hover:border-wa-brand/30 hover:bg-wa-brand/5 dark:hover:bg-wa-brand/10"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-200 ${
                  formData.messageType === "media"
                    ? "bg-wa-brand text-white"
                    : "bg-wa-brand/10 text-wa-brand"
                }`}
              >
                <Image className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  Media
                </div>
                <div className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Send image, video, audio, or document
                </div>
              </div>
            </Label>
          </div>

          {/* Template Message */}
          <div className="group relative">
            <RadioGroupItem
              value="template"
              id="template"
              className="sr-only"
            />
            <Label
              htmlFor="template"
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                formData.messageType === "template"
                  ? "border-wa-brand bg-wa-brand/5 dark:bg-wa-brand/10 shadow-sm"
                  : "border-wa-border-light dark:border-wa-border-dark hover:border-wa-brand/30 hover:bg-wa-brand/5 dark:hover:bg-wa-brand/10"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-200 ${
                  formData.messageType === "template"
                    ? "bg-wa-brand text-white"
                    : "bg-wa-brand/10 text-wa-brand"
                }`}
              >
                <TemplateIcon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  Template
                </div>
                <div className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Use a saved template to send
                </div>
              </div>
            </Label>
          </div>

          {/* Mixed Content */}
          <div className="group relative">
            <RadioGroupItem value="mixed" id="mixed" className="sr-only" />
            <Label
              htmlFor="mixed"
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                formData.messageType === "mixed"
                  ? "border-wa-brand bg-wa-brand/5 dark:bg-wa-brand/10 shadow-sm"
                  : "border-wa-border-light dark:border-wa-border-dark hover:border-wa-brand/30 hover:bg-wa-brand/5 dark:hover:bg-wa-brand/10"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-200 ${
                  formData.messageType === "mixed"
                    ? "bg-wa-brand text-white"
                    : "bg-wa-brand/10 text-wa-brand"
                }`}
              >
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  Mixed Content
                </div>
                <div className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Combine text content with media file
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Dynamic Content Based on Message Type */}
      {renderMessageContentByType(formData.messageType || "text")}
    </div>
  );

  const renderABTestingForm = () => (
    <div className="space-y-6">
      {/* A/B Testing Header */}
      <div className="bg-wa-brand/5 dark:bg-wa-brand/10 p-4 rounded-lg border border-wa-brand/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-wa-brand" />
            <span className="font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark">
              A/B Testing Mode
            </span>
          </div>
        </div>
        <p className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark mt-2">
          Create multiple message variants to test which performs better with
          your audience.
        </p>
      </div>

      {/* Message Type Selection with Enhanced Radio Buttons */}
      <div className="space-y-4">
        <RadioGroup
          value={formData.messageType || "text"}
          onValueChange={handleMessageTypeChange}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {/* Text Message */}
          <div className="group relative">
            <RadioGroupItem value="text" id="ab-text" className="sr-only" />
            <Label
              htmlFor="ab-text"
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                formData.messageType === "text"
                  ? "border-wa-brand bg-wa-brand/5 dark:bg-wa-brand/10 shadow-sm"
                  : "border-wa-border-light dark:border-wa-border-dark hover:border-wa-brand/30 hover:bg-wa-brand/5 dark:hover:bg-wa-brand/10"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-200 ${
                  formData.messageType === "text"
                    ? "bg-wa-brand text-white"
                    : "bg-wa-brand/10 text-wa-brand"
                }`}
              >
                <MessageSquareText className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  Text
                </div>
                <div className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Send text message to your audience
                </div>
              </div>
            </Label>
          </div>

          {/* Media Message */}
          <div className="group relative">
            <RadioGroupItem value="media" id="ab-media" className="sr-only" />
            <Label
              htmlFor="ab-media"
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                formData.messageType === "media"
                  ? "border-wa-brand bg-wa-brand/5 dark:bg-wa-brand/10 shadow-sm"
                  : "border-wa-border-light dark:border-wa-border-dark hover:border-wa-brand/30 hover:bg-wa-brand/5 dark:hover:bg-wa-brand/10"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-200 ${
                  formData.messageType === "media"
                    ? "bg-wa-brand text-white"
                    : "bg-wa-brand/10 text-wa-brand"
                }`}
              >
                <Image className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  Media
                </div>
                <div className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Send image, video, audio, or document
                </div>
              </div>
            </Label>
          </div>

          {/* Template Message */}
          <div className="group relative">
            <RadioGroupItem
              value="template"
              id="ab-template"
              className="sr-only"
            />
            <Label
              htmlFor="ab-template"
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                formData.messageType === "template"
                  ? "border-wa-brand bg-wa-brand/5 dark:bg-wa-brand/10 shadow-sm"
                  : "border-wa-border-light dark:border-wa-border-dark hover:border-wa-brand/30 hover:bg-wa-brand/5 dark:hover:bg-wa-brand/10"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-200 ${
                  formData.messageType === "template"
                    ? "bg-wa-brand text-white"
                    : "bg-wa-brand/10 text-wa-brand"
                }`}
              >
                <TemplateIcon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  Template
                </div>
                <div className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Use a saved template to send
                </div>
              </div>
            </Label>
          </div>

          {/* Mixed Content */}
          <div className="group relative">
            <RadioGroupItem value="mixed" id="ab-mixed" className="sr-only" />
            <Label
              htmlFor="ab-mixed"
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                formData.messageType === "mixed"
                  ? "border-wa-brand bg-wa-brand/5 dark:bg-wa-brand/10 shadow-sm"
                  : "border-wa-border-light dark:border-wa-border-dark hover:border-wa-brand/30 hover:bg-wa-brand/5 dark:hover:bg-wa-brand/10"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-200 ${
                  formData.messageType === "mixed"
                    ? "bg-wa-brand text-white"
                    : "bg-wa-brand/10 text-wa-brand"
                }`}
              >
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  Mixed Content
                </div>
                <div className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Combine text content with media file
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Message Variants */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark">
            Message Variants
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const currentVariants = formData.messageVariants || [];
              const newVariant = {
                variant: String.fromCharCode(65 + currentVariants.length),
                content: "",
                mediaFile: null,
                templateId: "",
              };
              onFormChange("messageVariants", [...currentVariants, newVariant]);
            }}
            className="text-wa-brand border-wa-brand/30 hover:bg-wa-brand/10"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Variant
          </Button>
        </div>

        <div className="space-y-4">
          {(formData.messageVariants || []).map((variant, index) => (
            <div
              key={index}
              className="border border-wa-border-light dark:border-wa-border-dark rounded-lg p-4 bg-wa-bg-chat-light dark:bg-wa-bg-chat-dark"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  Variant {variant.variant}
                </span>
                {(formData.messageVariants || []).length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const currentVariants = formData.messageVariants || [];
                      const updatedVariants = currentVariants.filter(
                        (_, i) => i !== index
                      );
                      onFormChange("messageVariants", updatedVariants);
                    }}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {renderMessageContentByType(
                formData.messageType || "text",
                index
              )}

              {/* Show available merge fields if audience is selected */}
              {formData.availableMergeFields &&
                formData.availableMergeFields.length > 0 &&
                formData.messageType === "text" && (
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                        Available variables for personalization:
                      </span>
                      <span className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                        {formData.availableMergeFields.length} fields
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.availableMergeFields.map(
                        (field, fieldIndex) => {
                          // Check if this field is already in the specific variant's message content
                          const fieldValue = `{{${field.field}}}`;
                          const variantContent =
                            formData.messageVariants?.[index]?.content || "";
                          const isInserted =
                            variantContent.includes(fieldValue);

                          return (
                            <button
                              key={fieldIndex}
                              type="button"
                              onClick={() => {
                                const textarea = document.querySelector(
                                  `textarea[placeholder="Enter your message content..."]`
                                );
                                if (textarea) {
                                  const start = textarea.selectionStart;
                                  const end = textarea.selectionEnd;
                                  const text = textarea.value;
                                  const before = text.substring(0, start);
                                  const after = text.substring(end);
                                  const newText = before + fieldValue + after;

                                  // Update the textarea value
                                  textarea.value = newText;

                                  // Update the form state immediately for visual feedback
                                  if (abTestingEnabled) {
                                    const updatedVariants = [
                                      ...(formData.messageVariants || []),
                                    ];
                                    updatedVariants[index] = {
                                      ...updatedVariants[index],
                                      content: newText,
                                    };
                                    onFormChange(
                                      "messageVariants",
                                      updatedVariants
                                    );
                                  } else {
                                    onFormChange("messageContent", newText);
                                  }

                                  // Set cursor position after the inserted variable
                                  const newPosition = start + fieldValue.length;
                                  textarea.setSelectionRange(
                                    newPosition,
                                    newPosition
                                  );
                                  textarea.focus();
                                }
                              }}
                              className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 font-medium ${
                                isInserted
                                  ? "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
                              }`}
                              title={`Click to insert ${fieldValue} - ${field.label}`}
                            >
                              {field.label}
                            </button>
                          );
                        }
                      )}
                    </div>
                    <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                      Click any variable above to insert it into your message.
                      Dimmed fields are already inserted but can be added again.
                    </p>
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {abTestingEnabled ? renderABTestingForm() : renderSingleMessageForm()}
    </div>
  );
};

export default MessageContentSection;
