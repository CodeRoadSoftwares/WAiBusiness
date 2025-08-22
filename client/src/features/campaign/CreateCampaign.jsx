import React, { useState, useEffect } from "react";
import {
  CollapsibleSection,
  MessageContentSection,
  AudienceSection,
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

function CreateCampaign() {
  const [formData, setFormData] = useState({
    // Campaign Information
    name: "",
    campaignType: "marketing",
    description: "",

    // Audience Selection
    audienceType: "",
    audienceFile: null,
    existingAudienceId: "",
    saveAudienceForFuture: false,

    // Audience Variables (extracted from file)
    audienceHeaders: [],
    audienceContactCount: 0,
    availableMergeFields: [],

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
  });

  const handleFormChange = (name, value) => {
    console.log("Form change:", name, "=", value);
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: value,
      };
      console.log("New form data:", newData);
      return newData;
    });
  };

  // Debug: Log formData changes
  useEffect(() => {
    console.log("FormData updated:", formData);
  }, [formData]);

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
          <CollapsibleSection title="Audience" defaultOpen={false} icon={Users}>
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
          >
            <MessageContentSection
              formData={formData}
              onFormChange={handleFormChange}
              abTestingEnabled={formData.abTesting}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Scheduling & Delivery"
            defaultOpen={false}
            icon={Calendar}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Schedule Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
                    Schedule Date
                  </label>
                  <Input
                    type="datetime-local"
                    placeholder="Select date and time"
                    className="w-full"
                  />
                </div>

                {/* Time Zone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
                    Time Zone
                  </label>
                  <Select value="" onValueChange={() => {}}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">
                        UTC (Coordinated Universal Time)
                      </SelectItem>
                      <SelectItem value="est">
                        EST (Eastern Standard Time)
                      </SelectItem>
                      <SelectItem value="pst">
                        PST (Pacific Standard Time)
                      </SelectItem>
                      <SelectItem value="gmt">
                        GMT (Greenwich Mean Time)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Recurring Options */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
                  Recurring Options
                </label>
                <div className="bg-wa-bg-chat-light dark:bg-wa-bg-chat-dark p-4 rounded-lg border border-wa-border-light/30 dark:border-wa-border-dark/30">
                  <p className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                    Set up recurring campaigns for regular messaging. Choose
                    frequency, end date, and delivery preferences.
                  </p>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Advanced Settings"
            defaultOpen={false}
            icon={Settings}
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
          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Form Data (Debug)</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </div>

        {/* Right Column - Message Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Message Preview
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    WhatsApp
                  </span>
                </div>
              </div>

              {/* Preview Content */}
              <div className="space-y-4">
                {/* Campaign Info Preview */}
                {formData.name && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formData.name}
                    </p>
                    {formData.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {formData.description}
                      </p>
                    )}
                  </div>
                )}

                {/* Message Content Preview */}
                {formData.messageContent && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border-l-4 border-green-500">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {formData.messageContent}
                    </p>
                  </div>
                )}

                {/* Audience Preview */}
                {formData.audienceContactCount > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border-l-4 border-blue-500">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {formData.audienceContactCount} contacts
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {formData.audienceHeaders.length} personalization fields
                      available
                    </p>
                  </div>
                )}

                {/* Default Preview State */}
                {!formData.name &&
                  !formData.messageContent &&
                  !formData.audienceContactCount && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">
                        Start building your campaign to see a preview here
                      </p>
                    </div>
                  )}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Test Message
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    Preview List
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateCampaign;
