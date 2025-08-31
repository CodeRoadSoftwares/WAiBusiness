import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CollapsibleSection,
  MessageContentSection,
  AudienceSection,
  ScheduleSection,
} from "./components";
import {
  Users,
  MessageSquare,
  Calendar,
  Settings,
  Tag,
  FileText,
  Type,
  Megaphone,
  LockKeyhole,
  Eye,
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
import { useGetAuthStatusQuery } from "@/features/auth/api/authApi";
import { useCreateCampaignMutation } from "./api/campaignApi";
import { CgAttachment } from "react-icons/cg";
import { DateTime } from "luxon";
import {
  MdCampaign,
  MdOutlineAttachment,
  MdOutlinePhotoCamera,
} from "react-icons/md";
import { GrAttachment } from "react-icons/gr";
import { BiSolidSend } from "react-icons/bi";
import WhatsAppPreview from "../../shared/components/WhatsAppPreview";
import AlertDialogComponent from "@/components/ui/AlertDialog";

// Create Campaign Button Component with Validations
const CreateCampaignButton = ({ formData, onFormReset }) => {
  const navigate = useNavigate();
  const [createCampaign, { isLoading, error }] = useCreateCampaignMutation();
  const [validationErrors, setValidationErrors] = useState([]);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Validation function
  const validateForm = () => {
    const errors = [];

    // Basic campaign info validation
    if (!formData.name?.trim()) {
      errors.push("Campaign name is required");
    }

    // Audience validation
    if (formData.audienceType === "upload" && !formData.audienceFile) {
      errors.push("Please upload a contact list file");
    }

    if (formData.audienceType === "existing" && !formData.existingAudienceId) {
      errors.push("Please select an existing audience");
    }

    if (
      formData.audienceType === "manual" &&
      !formData.manualPhoneNumbers?.trim()
    ) {
      errors.push("Please enter phone numbers manually");
    }

    if (formData.audienceContactCount === 0) {
      errors.push("No contacts found in the audience");
    }

    // Message validation
    if (formData.messageType === "text" && !formData.messageContent?.trim()) {
      errors.push("Message content is required");
    }

    if (formData.messageType === "media" && !formData.mediaFile) {
      errors.push("Please upload a media file");
    }

    if (
      formData.messageType === "mixed" &&
      (!formData.messageContent?.trim() || !formData.mediaFile)
    ) {
      errors.push("Mixed content requires both message text and media file");
    }

    if (formData.messageType === "template" && !formData.templateId) {
      errors.push("Please select a message template");
    }

    // Schedule validation
    if (formData.scheduleType === "scheduled" && !formData.scheduledDate) {
      errors.push("Please select a scheduled date and time");
    }

    if (
      formData.scheduleType === "delayed" &&
      (!formData.customDelay || formData.customDelay <= 0)
    ) {
      errors.push("Please set a valid delay time");
    }

    // Advanced settings validation
    if (formData.rateLimit < 1 || formData.rateLimit > 100) {
      errors.push("Rate limit must be between 1 and 100 messages per minute");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Real-time validation updates after first submit attempt
  React.useEffect(() => {
    if (hasAttemptedSubmit) {
      validateForm();
    }
  }, [formData, hasAttemptedSubmit]);

  // Handle campaign creation
  const handleCreateCampaign = async () => {
    setHasAttemptedSubmit(true);

    if (!validateForm()) {
      return;
    }

    try {
      // Create FormData for file uploads
      const campaignFormData = new FormData();

      // Add all campaign data
      campaignFormData.append("name", formData.name);
      campaignFormData.append("description", formData.description);
      campaignFormData.append("campaignType", formData.campaignType);
      campaignFormData.append("audienceType", formData.audienceType);
      campaignFormData.append(
        "existingAudienceId",
        formData.existingAudienceId
      );
      campaignFormData.append(
        "saveAudienceForFuture",
        formData.saveAudienceForFuture
      );
      campaignFormData.append(
        "manualPhoneNumbers",
        formData.manualPhoneNumbers
      );
      campaignFormData.append("messageType", formData.messageType);
      campaignFormData.append("messageContent", formData.messageContent);
      campaignFormData.append("templateId", formData.templateId);
      campaignFormData.append(
        "messageVariants",
        JSON.stringify(formData.messageVariants)
      );
      campaignFormData.append("abTesting", formData.abTesting);
      campaignFormData.append("rateLimit", formData.rateLimit);
      campaignFormData.append("randomDelay", formData.randomDelay);
      campaignFormData.append("autoRetry", formData.autoRetry);
      campaignFormData.append("scheduleType", formData.scheduleType);
      campaignFormData.append(
        "scheduledDate",
        formData.scheduledDate
          ? formData.scheduledDate.toLocaleString("sv-SE")
          : ""
      );
      campaignFormData.append("timeZone", formData.timeZone);
      campaignFormData.append("customDelay", formData.customDelay);
      campaignFormData.append("delayUnit", formData.delayUnit);

      // Add availableMergeFields (this is crucial for audience processing)
      campaignFormData.append(
        "availableMergeFields",
        JSON.stringify(formData.availableMergeFields)
      );

      // Add files if they exist
      if (formData.audienceFile instanceof File) {
        campaignFormData.append("audienceFile", formData.audienceFile);
      }

      if (formData.mediaFile instanceof File) {
        campaignFormData.append("mediaFile", formData.mediaFile);
      }

      // Debug: Check for duplicate keys
      const keys = [];
      for (let [key] of campaignFormData.entries()) {
        keys.push(key);
      }

      // Check for duplicates
      const duplicates = keys.filter(
        (item, index) => keys.indexOf(item) !== index
      );
      if (duplicates.length > 0) {
        console.warn("⚠️ Duplicate keys found:", duplicates);
      }

      await createCampaign(campaignFormData).unwrap();

      // Show success dialog
      setShowSuccessDialog(true);
    } catch (err) {
      console.error("Failed to create campaign:", err);
      // Error is already handled by RTK Query
    }
  };

  // Handle success dialog close and redirect
  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    // Reset form and redirect to campaign page
    onFormReset();
    navigate("/campaign");
  };

  return (
    <div className="space-y-4">
      {/* Success Dialog */}
      <AlertDialogComponent
        isOpen={showSuccessDialog}
        onClose={handleSuccessDialogClose}
        type="success"
        title="Campaign Created! 🎉"
        description="Your campaign has been created and is ready to go. You can now manage it from your campaigns dashboard."
        buttonText="Go to Campaigns"
        showCancel={false}
      />

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

      {/* Create Campaign Button */}
      <Button
        onClick={handleCreateCampaign}
        size="xl"
        disabled={isLoading || validationErrors.length > 0}
        className="w-full bg-wa-brand hover:bg-wa-brand/90 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Creating Campaign...
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xl">
            <MdCampaign className="text-white !w-8 !h-8 -rotate-12" />
            Create Campaign
          </div>
        )}
      </Button>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            Failed to create campaign:
          </h4>
          <p className="text-sm text-red-700 dark:text-red-300">
            {error?.data?.message ||
              error?.error ||
              "An unexpected error occurred"}
          </p>
        </div>
      )}
    </div>
  );
};

function CreateCampaign() {
  const { data: authData } = useGetAuthStatusQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [formData, setFormData] = useState({
    // Campaign Information
    name: "",
    campaignType: "marketing",
    description: "",

    // Audience Selection
    audienceType: "upload",
    audienceFile: null,
    existingAudienceId: "",
    saveAudienceForFuture: false,

    // Audience Variables (extracted from file)
    audienceHeaders: [],
    audienceContactCount: 0,
    availableMergeFields: [],
    audienceSampleData: [], // First row data for preview

    // Message Content
    messageType: "text",
    messageContent: "",
    mediaFile: null,
    templateId: "",
    messageVariants: [],

    // Advanced Settings
    abTesting: false,
    rateLimit: 20,
    randomDelay: true,
    autoRetry: true,

    // Schedule & Timezone
    scheduleType: "scheduled",
    scheduledDate: null,
    timeZone: "IST",
    customDelay: 0,
    delayUnit: "minutes",
  });

  const handleFormChange = (name, value) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: value,
      };
      return newData;
    });
  };

  const handleFormReset = () => {
    setFormData({
      // Campaign Information
      name: "",
      campaignType: "marketing",
      description: "",

      // Audience Selection
      audienceType: "upload",
      audienceFile: null,
      existingAudienceId: "",
      saveAudienceForFuture: false,

      // Audience Variables (extracted from file)
      audienceHeaders: [],
      audienceContactCount: 0,
      availableMergeFields: [],
      audienceSampleData: [], // First row data for preview

      // Message Content
      messageType: "text",
      messageContent: "",
      mediaFile: null,
      templateId: "",
      messageVariants: [],

      // Advanced Settings
      abTesting: false,
      rateLimit: 20,
      randomDelay: true,
      autoRetry: true,

      // Schedule & Timezone
      scheduleType: "scheduled",
      scheduledDate: null,
      timeZone: "IST",
      customDelay: 0,
      delayUnit: "minutes",
    });
  };

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Information Section - Non-collapsible */}
          <CollapsibleSection
            title="Basic"
            defaultOpen={true}
            icon={Megaphone}
            nonCollapsible={true}
          >
            <div className="space-y-6">
              {/* Campaign Name and Type in one row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Campaign Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
                    <Tag className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
                    Campaign Name <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Input
                    placeholder="Enter campaign name"
                    value={formData.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Campaign Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
                    <Type className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
                    Campaign Type <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Select
                    value={formData.campaignType}
                    onValueChange={(value) =>
                      handleFormChange("campaignType", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select campaign type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="transactional">
                        Transactional
                      </SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description - Full width below */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
                  Description
                </label>
                <Textarea
                  placeholder="Describe your campaign purpose and goals..."
                  value={formData.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                  className="w-full min-h-[100px]"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Audience Section - Now before Content */}
          <CollapsibleSection
            title="Audience"
            defaultOpen={false}
            icon={Users}
            status={
              formData.audienceType === "upload" && formData.audienceFile
                ? "File Uploaded"
                : formData.audienceType === "existing" &&
                  formData.existingAudienceId
                ? "Audience Set"
                : formData.audienceType === "manual" &&
                  formData.manualPhoneNumbers?.trim()
                ? "Manual Entry"
                : "Not Set"
            }
          >
            <AudienceSection
              formData={formData}
              onFormChange={handleFormChange}
            />
          </CollapsibleSection>

          {/* Content Section */}
          <CollapsibleSection
            title="Content"
            defaultOpen={false}
            icon={MessageSquare}
            status={
              formData.messageType === "text" && formData.messageContent?.trim()
                ? "Text"
                : formData.messageType === "media" && formData.mediaFile
                ? "Media"
                : formData.messageType === "template" && formData.templateId
                ? "Template"
                : formData.messageType === "mixed" &&
                  formData.messageContent?.trim() &&
                  formData.mediaFile
                ? "Mixed"
                : "Not Set"
            }
          >
            <MessageContentSection
              formData={formData}
              onFormChange={handleFormChange}
              abTestingEnabled={formData.abTesting}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Schedule"
            defaultOpen={false}
            icon={Calendar}
            status={
              formData.scheduleType === "immediate"
                ? "Immediate"
                : formData.scheduleType === "delayed"
                ? "Delayed"
                : formData.scheduleType === "scheduled"
                ? "Scheduled"
                : "Not Set"
            }
          >
            <ScheduleSection
              formData={formData}
              onFormChange={handleFormChange}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Advanced Settings"
            defaultOpen={false}
            icon={Settings}
            disabled={true}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rate Limiting */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
                    <Settings className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
                    Messages per Minute
                  </label>
                  <Input
                    type="number"
                    placeholder="20"
                    value={formData.rateLimit}
                    onChange={(e) =>
                      handleFormChange(
                        "rateLimit",
                        parseInt(e.target.value) || 20
                      )
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                    Avoid WhatsApp rate limits
                  </p>
                </div>

                {/* A/B Testing */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
                    <Settings className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
                    A/B Testing
                  </label>
                  <Select
                    value={formData.abTesting ? "enabled" : "disabled"}
                    onValueChange={(value) =>
                      handleFormChange("abTesting", value === "enabled")
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Enable A/B testing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disabled">Disabled</SelectItem>
                      <SelectItem value="enabled">Enabled</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.abTesting && (
                    <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                      A/B testing enabled. Check the Content section to manage
                      variants.
                    </p>
                  )}
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
                  <Settings className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
                  Additional Options
                </label>
                <div className="bg-wa-bg-chat-light dark:bg-wa-bg-chat-dark p-4 rounded-lg border border-wa-border-light/30 dark:border-wa-border-dark/30">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                        Random Delay
                      </span>
                      <div
                        className={`w-10 h-6 rounded-full relative cursor-pointer transition-all duration-200 ${
                          formData.randomDelay
                            ? "bg-wa-brand"
                            : "bg-wa-brand/20"
                        }`}
                        onClick={() =>
                          handleFormChange("randomDelay", !formData.randomDelay)
                        }
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 ${
                            formData.randomDelay ? "right-1" : "left-1"
                          }`}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                        Auto Retry Failed
                      </span>
                      <div
                        className={`w-10 h-6 rounded-full relative cursor-pointer transition-all duration-200 ${
                          formData.autoRetry ? "bg-wa-brand" : "bg-wa-brand/20"
                        }`}
                        onClick={() =>
                          handleFormChange("autoRetry", !formData.autoRetry)
                        }
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 ${
                            formData.autoRetry ? "right-1" : "left-1"
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Debug Section - Remove this in production */}
          {/* <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Form Data (Debug)</h3>
            <pre className="text-xs overflow-auto">
              {(() => {
                // Create a debug-friendly version of formData
                const debugData = { ...formData };

                // Handle File objects specially
                if (debugData.mediaFile instanceof File) {
                  debugData.mediaFile = {
                    name: debugData.mediaFile.name,
                    size: debugData.mediaFile.size,
                    type: debugData.mediaFile.type,
                    lastModified: debugData.mediaFile.lastModified,
                    _type: "File",
                  };
                }

                if (debugData.audienceFile instanceof File) {
                  debugData.audienceFile = {
                    name: debugData.audienceFile.name,
                    size: debugData.audienceFile.size,
                    type: debugData.audienceFile.type,
                    lastModified: debugData.audienceFile.lastModified,
                    _type: "File",
                  };
                }

                return JSON.stringify(debugData, null, 2);
              })()}
            </pre>
          </div> */}

          {/* Create Campaign Button */}
          <CreateCampaignButton
            formData={formData}
            onFormReset={handleFormReset}
          />
        </div>

        {/* Right Column - WhatsApp Chat Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <CollapsibleSection
              title="Preview"
              defaultOpen={true}
              icon={Eye}
              nonCollapsible={true}
            >
              <WhatsAppPreview
                contactName={authData?.user?.name || "User"}
                contactStatus="online"
                contactInitial={
                  authData?.user?.name?.charAt(0)?.toUpperCase() || "U"
                }
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
                messageType={formData.messageType}
                messageContent={formData.messageContent}
                mediaFile={formData.mediaFile}
                defaultMessage="Start building your campaign to see the message here..."
                height="500px"
                showInputArea={true}
                showHeader={true}
                showMergeFields={true}
                mergeFields={formData.availableMergeFields.map((field) => ({
                  field: field.field,
                  label: field.label,
                  sampleValue:
                    formData.audienceSampleData?.[
                      formData.audienceHeaders.findIndex(
                        (header) =>
                          header.toLowerCase().replace(/\s+/g, "") ===
                          field.field
                      )
                    ] || `Sample ${field.label}`,
                }))}
                audienceCount={formData.audienceContactCount}
              />
            </CollapsibleSection>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateCampaign;
