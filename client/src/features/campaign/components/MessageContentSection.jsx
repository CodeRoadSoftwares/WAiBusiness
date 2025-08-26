import React, { useState, useEffect } from "react";
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
  Trash,
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
import { useGetTemplatesQuery } from "../../template/api/templateApi";
import longAgo from "@/shared/utils/longAgo";
import capitalize from "@/shared/utils/capitalize";

const MessageContentSection = ({
  formData,
  onFormChange,
  abTestingEnabled = false,
}) => {
  const [templateSearch, setTemplateSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(templateSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [templateSearch]);

  // Fetch templates with search
  const { data: templatesData, isLoading: isLoadingTemplates } =
    useGetTemplatesQuery({
      search: debouncedSearch,
      limit: 50,
      skip: 0,
    });

  const templates = templatesData?.templates || [];

  const handleMessageTypeChange = (value) => {
    console.log("Message type changed to:", value);
    onFormChange("messageType", value);

    // Clear template search when switching to template type
    if (value === "template") {
      clearTemplateSearch();
    }
  };

  const handleTemplateSearchChange = (value) => {
    setTemplateSearch(value);
  };

  const clearTemplateSearch = () => {
    setTemplateSearch("");
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
    console.log(
      "handleFileUpload called with:",
      file,
      "for variant:",
      variantIndex
    );
    console.log("abTestingEnabled:", abTestingEnabled);
    console.log("Current formData:", formData);

    // Validate file size (max 16MB for WhatsApp)
    const maxSize = 16 * 1024 * 1024; // 16MB
    if (file.size > maxSize) {
      alert(
        "File too large! WhatsApp supports files up to 16MB. Please choose a smaller file."
      );
      return;
    }

    if (abTestingEnabled) {
      console.log("Updating messageVariants for AB testing");
      const updatedVariants = [...(formData.messageVariants || [])];
      updatedVariants[variantIndex] = {
        ...updatedVariants[variantIndex],
        mediaFile: file,
      };
      console.log("Updated variants:", updatedVariants);
      onFormChange("messageVariants", updatedVariants);
    } else {
      console.log("Updating mediaFile for single message");
      onFormChange("mediaFile", file);
    }

    console.log("handleFileUpload completed");
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

    // Clear search after selection
    clearTemplateSearch();
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

        {/* Warning for manual audience with merge fields */}
        {formData.audienceType === "manual" &&
          (abTestingEnabled
            ? /\{\{[^}]+\}\}/.test(
                formData.messageVariants?.[variantIndex]?.content || ""
              )
            : /\{\{[^}]+\}\}/.test(formData.messageContent || "")) && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <svg
                  className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-red-700 dark:text-red-300">
                  <span className="font-medium">Merge fields detected!</span>{" "}
                  With manual audience, merge fields like{" "}
                  <code className="bg-red-100 dark:bg-red-800 px-1 rounded">
                    &#123;&#123;name&#125;&#125;
                  </code>{" "}
                  will be sent as plain text. Switch to "Upload File" for
                  personalized campaigns.
                </div>
              </div>
            </div>
          )}

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
      {(() => {
        const currentMediaFile = abTestingEnabled
          ? formData.messageVariants?.[variantIndex]?.mediaFile
          : formData.mediaFile;

        console.log(
          "renderMediaMessageForm - currentMediaFile:",
          currentMediaFile
        );
        console.log(
          "renderMediaMessageForm - formData.mediaFile:",
          formData.mediaFile
        );
        console.log(
          "renderMediaMessageForm - abTestingEnabled:",
          abTestingEnabled
        );

        if (!currentMediaFile) {
          // Show upload area only when no file is selected
          return (
            <div className="space-y-2">
              <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
                <Upload className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
                Upload Media File <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  id={`media-upload-${variantIndex}`}
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    console.log(
                      "Media file input onChange triggered:",
                      e.target.files
                    );
                    const file = e.target.files[0];
                    if (file) {
                      console.log("Media file selected:", file);
                      handleFileUpload(file, variantIndex);
                    } else {
                      console.log("No media file selected");
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
            </div>
          );
        } else {
          // Show file details and remove button when file is selected
          return (
            <div className="space-y-4">
              <div className="bg-wa-brand/5 dark:bg-wa-brand/10 p-4 rounded-lg border border-wa-brand/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Image className="w-5 h-5 text-wa-brand" />
                    <div>
                      <h4 className="font-medium text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                        {currentMediaFile.name}
                      </h4>
                      <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                        {(currentMediaFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (abTestingEnabled) {
                        const updatedVariants = [
                          ...(formData.messageVariants || []),
                        ];
                        updatedVariants[variantIndex] = {
                          ...updatedVariants[variantIndex],
                          mediaFile: null,
                        };
                        onFormChange("messageVariants", updatedVariants);
                      } else {
                        onFormChange("mediaFile", null);
                      }
                    }}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        }
      })()}
    </div>
  );

  const renderTemplateMessageForm = (variantIndex = 0) => {
    const selectedTemplateId = abTestingEnabled
      ? formData.messageVariants?.[variantIndex]?.templateId
      : formData.templateId;

    const selectedTemplate = templates.find(
      (t) => t._id === selectedTemplateId
    );

    return (
      <div className="space-y-4">
        {!selectedTemplate ? (
          <>
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
                      ? formData.messageVariants?.[variantIndex]?.templateId ||
                        ""
                      : formData.templateId || ""
                  }
                  onValueChange={(value) =>
                    handleTemplateSelection(value, variantIndex)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Search and select a template" />
                  </SelectTrigger>
                  <SelectContent
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search templates..."
                          className="pl-8"
                          value={templateSearch}
                          onChange={(e) =>
                            handleTemplateSearchChange(e.target.value)
                          }
                          onFocus={(e) => e.target.select()}
                          onKeyDown={(e) => {
                            // Prevent dropdown from closing on key presses
                            if (e.key === "Escape") {
                              e.stopPropagation();
                            }
                          }}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      {isLoadingTemplates ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          Loading templates...
                        </div>
                      ) : templates.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          {debouncedSearch
                            ? "No templates found"
                            : "No templates available"}
                        </div>
                      ) : (
                        templates.map((template) => (
                          <SelectItem key={template._id} value={template._id}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {capitalize(template.name)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {capitalize(template.type)} •
                                {template.lastUsed !== null &&
                                template.lastUsed !== undefined
                                  ? ` Last used ${longAgo(template.lastUsed)}`
                                  : " Never Used"}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="bg-wa-brand/5 dark:bg-wa-brand/10 p-3 rounded-lg border border-wa-brand/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-wa-brand" />
                  <div>
                    <h4 className="font-medium text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                      {capitalize(selectedTemplate.name)}
                    </h4>
                    <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                      {capitalize(selectedTemplate.type)} •
                      {selectedTemplate.lastUsed !== null &&
                      selectedTemplate.lastUsed !== undefined
                        ? ` Last used ${longAgo(selectedTemplate.lastUsed)}`
                        : " Never Used"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (abTestingEnabled) {
                      const updatedVariants = [
                        ...(formData.messageVariants || []),
                      ];
                      updatedVariants[variantIndex] = {
                        ...updatedVariants[variantIndex],
                        templateId: "",
                      };
                      onFormChange("messageVariants", updatedVariants);
                    } else {
                      onFormChange("templateId", "");
                    }

                    // Clear search when template is removed
                    clearTemplateSearch();
                  }}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Template Variables Warning */}
            {selectedTemplate.variables &&
              selectedTemplate.variables.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center ">
                    <FileText className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
                    Variables used in template
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((variable, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Template-Audience Variable Mismatch Warning */}
            {(() => {
              // Get audience variables
              const audienceVariables = formData.availableMergeFields.map(
                (field) => field.field
              );

              // Find variables in template that are not in audience
              const missingVariables = selectedTemplate.variables.filter(
                (templateVar) => !audienceVariables.includes(templateVar)
              );

              if (
                !selectedTemplate?.variables ||
                (formData.audienceType === "existing" &&
                  !formData.existingAudienceId) ||
                (formData.audienceType === "upload" && !formData.audienceFile)
                // !formData.availableMergeFields ||
                // formData.availableMergeFields.length === 0
              ) {
                return null;
              }

              if (
                formData.audienceType == "manual" &&
                selectedTemplate?.variables?.length > 0
              ) {
                return (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <svg
                        className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="text-sm text-amber-700 dark:text-amber-300">
                        <span className="font-medium">Not Recommended!</span>{" "}
                        Using a template with variables and a manual audience is not recommended. The variables in your template will appear as plain text in messages. 
                        <br />
                        Choose a different template without variables or to keep this template, you can:
                        <ul className="list-disc pl-5 mt-1">
                          <li>Upload an audience file (CSV/Excel) that includes these variables, or</li>
                          <li>Select an existing audience that contains these variables.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              }

              if (missingVariables.length > 0) {
                return (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <svg
                        className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="text-sm text-red-700 dark:text-red-300">
                        <span className="font-medium">
                          Variable Mismatch Detected!
                        </span>{" "}
                        Your template uses variables that your audience doesn't
                        have:{" "}
                        <code className="bg-red-100 dark:bg-red-800 px-1 rounded font-mono">
                          {missingVariables.join(", ")}
                        </code>
                        . These will appear as plain text in messages, making
                        them unreadable. Consider choosing a different template
                        or audience.
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })()}
          </div>
        )}
      </div>
    );
  };

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

        {/* Warning for manual audience with merge fields */}
        {formData.audienceType === "manual" &&
          (abTestingEnabled
            ? /\{\{[^}]+\}\}/.test(
                formData.messageVariants?.[variantIndex]?.content || ""
              )
            : /\{\{[^}]+\}\}/.test(formData.messageContent || "")) && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <svg
                  className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-red-700 dark:text-red-300">
                  <span className="font-medium">Merge fields detected!</span>{" "}
                  With manual audience, merge fields like{" "}
                  <code className="bg-red-100 dark:bg-red-800 px-1 rounded">
                    &#123;&#123;name&#125;&#125;
                  </code>{" "}
                  will be sent as plain text. Switch to "Upload File" for
                  personalized campaigns.
                </div>
              </div>
            </div>
          )}

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

      {/* Media Upload */}
      {(() => {
        const currentMediaFile = abTestingEnabled
          ? formData.messageVariants?.[variantIndex]?.mediaFile
          : formData.mediaFile;

        console.log(
          "renderMixedContentForm - currentMediaFile:",
          currentMediaFile
        );
        console.log(
          "renderMixedContentForm - formData.mediaFile:",
          formData.mediaFile
        );
        console.log(
          "renderMixedContentForm - abTestingEnabled:",
          abTestingEnabled
        );

        if (!currentMediaFile) {
          // Show upload area only when no file is selected
          return (
            <div className="space-y-2">
              <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
                <Upload className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
                Upload Media File <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  id={`mixed-media-upload-${variantIndex}`}
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    console.log(
                      "Mixed media file input onChange triggered:",
                      e.target.files
                    );
                    const file = e.target.files[0];
                    if (file) {
                      console.log("Mixed media file selected:", file);
                      handleFileUpload(file, variantIndex);
                    } else {
                      console.log("No mixed media file selected");
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
            </div>
          );
        } else {
          // Show file details and remove button when file is selected
          return (
            <div className="space-y-4">
              <div className="bg-wa-brand/5 dark:bg-wa-brand/10 p-4 rounded-lg border border-wa-brand/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Image className="w-5 h-5 text-wa-brand" />
                    <div>
                      <h4 className="font-medium text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                        {currentMediaFile.name}
                      </h4>
                      <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                        {(currentMediaFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (abTestingEnabled) {
                        const updatedVariants = [
                          ...(formData.messageVariants || []),
                        ];
                        updatedVariants[variantIndex] = {
                          ...updatedVariants[variantIndex],
                          mediaFile: null,
                        };
                        onFormChange("messageVariants", updatedVariants);
                      } else {
                        onFormChange("mediaFile", null);
                      }
                    }}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        }
      })()}
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
                    <Trash className="w-4 h-4" />
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
