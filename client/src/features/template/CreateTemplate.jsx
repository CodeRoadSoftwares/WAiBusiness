import React, { useState } from "react";
import { useCreateTemplateMutation } from "./api/templateApi";
import { CollapsibleSection } from "../campaign/components";
import WhatsAppPreview from "../../shared/components/WhatsAppPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  FileText,
  Plus,
  X,
  Upload,
  Image,
  FileText as TemplateIcon,
  Layers,
  MessageSquareText,
  Trash,
  ArrowLeft,
  Save,
  Eye,
  Copy,
  CheckCircle,
  Shapes,
  LockKeyhole,
} from "lucide-react";
import { IoCopy } from "react-icons/io5";
import AlertDialogComponent from "@/components/ui/AlertDialog";
import { useGetAuthStatusQuery } from "../auth/api/authApi";

function CreateTemplate() {
  const { data: authData } = useGetAuthStatusQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [createTemplate, { isLoading, error }] = useCreateTemplateMutation();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "text",
    text: "",
    mediaFile: null,
  });

  const handleFormChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation errors when user starts fixing them
    if (hasAttemptedSubmit && validationErrors.length > 0) {
      // Re-validate the form to see if errors are resolved
      const newErrors = [];

      if (!value.trim() && name === "name") {
        newErrors.push("Template name is required");
      }

      if (name === "text" && formData.type === "text" && !value.trim()) {
        newErrors.push("Text content is required for text templates");
      }

      if (name === "mediaFile" && formData.type === "media" && !value) {
        newErrors.push("Media file is required for media templates");
      }

      if (formData.type === "mixed") {
        if (name === "text" && !value.trim()) {
          newErrors.push(
            "Mixed templates require both text content and media file"
          );
        }
        if (name === "mediaFile" && !value) {
          newErrors.push(
            "Mixed templates require both text content and media file"
          );
        }
        if (name === "text" && value.trim() && !formData.mediaFile) {
          newErrors.push(
            "Mixed templates require both text content and media file"
          );
        }
        if (name === "mediaFile" && value && !formData.text?.trim()) {
          newErrors.push(
            "Mixed templates require both text content and media file"
          );
        }
      }

      setValidationErrors(newErrors);
    }
  };

  const handleTypeChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      type: value,
      // Clear content when switching types to avoid validation conflicts
      text: "",
      mediaFile: null,
    }));

    // Clear validation errors when switching types
    setValidationErrors([]);
  };

  const handleFileUpload = (file) => {
    // Validate file size (max 16MB for WhatsApp)
    const maxSize = 16 * 1024 * 1024; // 16MB
    if (file.size > maxSize) {
      alert(
        "File too large! WhatsApp supports files up to 16MB. Please choose a smaller file."
      );
      return;
    }

    setFormData((prev) => ({
      ...prev,
      mediaFile: file,
    }));

    // Clear validation errors related to media file when uploaded
    if (hasAttemptedSubmit && validationErrors.length > 0) {
      const newErrors = validationErrors.filter(
        (error) =>
          !error.includes("Media file is required") &&
          !error.includes(
            "Mixed templates require both text content and media file"
          )
      );
      setValidationErrors(newErrors);
    }
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.name?.trim()) {
      errors.push("Template name is required");
    }

    if (formData.type === "text" && !formData.text?.trim()) {
      errors.push("Text content is required for text templates");
    }

    if (formData.type === "media" && !formData.mediaFile) {
      errors.push("Media file is required for media templates");
    }

    if (
      formData.type === "mixed" &&
      (!formData.text?.trim() || !formData.mediaFile)
    ) {
      errors.push("Mixed templates require both text content and media file");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleCreateTemplate = async () => {
    setHasAttemptedSubmit(true);

    if (!validateForm()) {
      return;
    }

    try {
      const templateFormData = new FormData();
      templateFormData.append("name", formData.name);
      templateFormData.append("description", formData.description);
      templateFormData.append("type", formData.type);
      templateFormData.append("text", formData.text);

      if (formData.mediaFile instanceof File) {
        templateFormData.append("mediaFile", formData.mediaFile);
      }

      const result = await createTemplate(templateFormData).unwrap();
      console.log("Template created successfully:", result);
      setShowSuccessDialog(true);
    } catch (err) {
      console.error("Failed to create template:", err);
    }
  };

  const renderTextTemplateForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
          <MessageSquareText className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
          Message <span className="text-red-500 ml-1">*</span>
        </label>
        <Textarea
          placeholder="Enter your template content..."
          value={formData.text}
          onChange={(e) => handleFormChange("text", e.target.value)}
          className="w-full min-h-[200px]"
          required
        />
        <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
          Write your message template. You can use variables like{" "}
          <code>&#123;&#123;name&#125;&#125;</code>,{" "}
          <code>&#123;&#123;company&#125;&#125;</code>, etc.
        </p>
      </div>
    </div>
  );

  const renderMediaTemplateForm = () => (
    <div className="space-y-4">
      {!formData.mediaFile ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
            <Upload className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
            Media File <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              type="file"
              id="media-upload"
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleFileUpload(file);
                }
              }}
            />
            <label
              htmlFor="media-upload"
              className="border-2 border-dashed border-wa-border-light dark:border-wa-border-dark rounded-lg p-8 text-center hover:border-wa-brand/50 transition-colors cursor-pointer block"
            >
              <div className="space-y-3">
                <Upload className="w-12 h-12 mx-auto text-wa-icon-light dark:text-wa-icon-dark" />
                <p className="text-lg text-wa-text-secondary-light dark:text-wa-text-secondary-dark font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Supports: Images, Videos, Audio, Documents (Max 16MB)
                </p>
              </div>
            </label>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-wa-brand/5 dark:bg-wa-brand/10 p-4 rounded-lg border border-wa-brand/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Image className="w-5 h-5 text-wa-brand" />
                <div>
                  <h4 className="font-medium text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                    {formData.mediaFile.name}
                  </h4>
                  <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                    {(formData.mediaFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleFormChange("mediaFile", null)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderMixedTemplateForm = () => (
    <div className="space-y-6">
      {/* Text Content */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
          <MessageSquareText className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
          Message <span className="text-red-500 ml-1">*</span>
        </label>
        <Textarea
          placeholder="Enter your template content..."
          value={formData.text}
          onChange={(e) => handleFormChange("text", e.target.value)}
          className="w-full min-h-[150px] resize-none"
          required
        />
        <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
          Write your message template. This will appear as a caption with your
          media.
        </p>
      </div>

      {/* Media Upload */}
      {!formData.mediaFile ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
            <Upload className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
            Media File <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              type="file"
              id="mixed-media-upload"
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleFileUpload(file);
                }
              }}
            />
            <label
              htmlFor="mixed-media-upload"
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
      ) : (
        <div className="space-y-4">
          <div className="bg-wa-brand/5 dark:bg-wa-brand/10 p-4 rounded-lg border border-wa-brand/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Image className="w-5 h-5 text-wa-brand" />
                <div>
                  <h4 className="font-medium text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                    {formData.mediaFile.name}
                  </h4>
                  <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                    {(formData.mediaFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleFormChange("mediaFile", null)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTemplateContentByType = (type) => {
    switch (type) {
      case "text":
        return renderTextTemplateForm();
      case "media":
        return renderMediaTemplateForm();
      case "mixed":
        return renderMixedTemplateForm();
      default:
        return renderTextTemplateForm();
    }
  };

  const renderWhatsAppPreview = () => {
    return (
      <WhatsAppPreview
        contactName={authData?.user?.name || "User"}
        contactStatus="online"
        contactInitial={authData?.user?.name?.charAt(0)?.toUpperCase() || "W"}
        systemMessages={[
          {
            type: "info",
            content: "Today",
            variant: "default",
          },
          {
            type: "info",
            content:
              "Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them. Learn more.",
            icon: LockKeyhole,
            variant: "info",
          },
        ]}
        messageType={formData.type}
        messageContent={formData.text}
        mediaFile={formData.mediaFile}
        defaultMessage="Start building your template to see the preview here..."
        height="500px"
        showInputArea={true}
        showHeader={true}
      />
    );
  };

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Information */}
            <CollapsibleSection
              title="Basic"
              defaultOpen={true}
              icon={FileText}
              nonCollapsible={true}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter template name"
                    value={formData.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark">
                    Description
                  </label>
                  <Textarea
                    placeholder="Describe your template purpose..."
                    value={formData.description}
                    onChange={(e) =>
                      handleFormChange("description", e.target.value)
                    }
                    className="w-full min-h-[80px] resize-none"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Template Type Selection */}
            <CollapsibleSection
              title="Type"
              defaultOpen={true}
              icon={Shapes}
              nonCollapsible={true}
            >
              <RadioGroup
                value={formData.type}
                onValueChange={(value) => handleTypeChange(value)}
                className="grid grid-cols-1 md:grid-cols-3 gap-3"
              >
                {/* Text Template */}
                <div className="group relative">
                  <RadioGroupItem value="text" id="text" className="sr-only" />
                  <Label
                    htmlFor="text"
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      formData.type === "text"
                        ? "border-wa-brand bg-wa-brand/5 dark:bg-wa-brand/10 shadow-sm"
                        : "border-wa-border-light dark:border-wa-border-dark hover:border-wa-brand/30 hover:bg-wa-brand/5 dark:hover:bg-wa-brand/10"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-200 ${
                        formData.type === "text"
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
                        Text-only message
                      </div>
                    </div>
                  </Label>
                </div>

                {/* Media Template */}
                <div className="group relative">
                  <RadioGroupItem
                    value="media"
                    id="media"
                    className="sr-only"
                  />
                  <Label
                    htmlFor="media"
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      formData.type === "media"
                        ? "border-wa-brand bg-wa-brand/5 dark:bg-wa-brand/10 shadow-sm"
                        : "border-wa-border-light dark:border-wa-border-dark hover:border-wa-brand/30 hover:bg-wa-brand/5 dark:hover:bg-wa-brand/10"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-200 ${
                        formData.type === "media"
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
                        Image, video, audio, or document
                      </div>
                    </div>
                  </Label>
                </div>

                {/* Mixed Template */}
                <div className="group relative">
                  <RadioGroupItem
                    value="mixed"
                    id="mixed"
                    className="sr-only"
                  />
                  <Label
                    htmlFor="mixed"
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      formData.type === "mixed"
                        ? "border-wa-brand bg-wa-brand/5 dark:bg-wa-brand/10 shadow-sm"
                        : "border-wa-border-light dark:border-wa-border-dark hover:border-wa-brand/30 hover:bg-wa-brand/5 dark:hover:bg-wa-brand/10"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-200 ${
                        formData.type === "mixed"
                          ? "bg-wa-brand text-white"
                          : "bg-wa-brand/10 text-wa-brand"
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                        Mixed
                      </div>
                      <div className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                        Media with text caption
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CollapsibleSection>

            {/* Template Content */}
            <CollapsibleSection
              title="Content"
              defaultOpen={true}
              icon={MessageSquare}
              nonCollapsible={true}
            >
              {renderTemplateContentByType(formData.type)}
            </CollapsibleSection>

            {/* Validation Errors */}
            {hasAttemptedSubmit && validationErrors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                  Please fix the following issues:
                </h4>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Create Template Button */}
            <Button
              onClick={handleCreateTemplate}
              size="xl"
              disabled={isLoading || validationErrors.length > 0}
              className="w-full bg-wa-brand hover:bg-wa-brand/90 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Template...
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xl">
                  <IoCopy className="text-white !w-6 !h-6" />
                  Create Template
                </div>
              )}
            </Button>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                  Failed to create template:
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error?.data?.message ||
                    error?.error ||
                    "An unexpected error occurred"}
                </p>
              </div>
            )}
          </div>

          {/* Right Column - WhatsApp Preview */}
          <div className="space-y-6">
            <div className="sticky top-8">
              <CollapsibleSection
                title="Preview"
                defaultOpen={true}
                icon={Eye}
                nonCollapsible={true}
              >
                {renderWhatsAppPreview()}
              </CollapsibleSection>
            </div>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <AlertDialogComponent
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        type="success"
        title="Template Created! 🎉"
        description="Your template has been created successfully and is now available for use in your campaigns."
        buttonText="OK"
        showCancel={false}
        onConfirm={() => {
          setShowSuccessDialog(false);
          // Reset form data
          setFormData({
            name: "",
            description: "",
            type: "text",
            text: "",
            mediaFile: null,
          });
          setValidationErrors([]);
          setHasAttemptedSubmit(false);
        }}
      />
    </div>
  );
}

export default CreateTemplate;
