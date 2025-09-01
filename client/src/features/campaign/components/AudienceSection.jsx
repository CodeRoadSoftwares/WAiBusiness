import React, { useState, useEffect } from "react";
import {
  Users,
  Upload,
  FileText,
  Plus,
  Search,
  Check,
  X,
  Table,
  Trash,
  Edit3,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import AlertDialogComponent from "@/components/ui/AlertDialog";
import Spinner from "@/shared/components/Spinner";
import * as XLSX from "xlsx";
import { useGetAudienceQuery } from "@/features/audience/api/audienceApi";
import longAgo from "@/shared/utils/longAgo";
import { Textarea } from "@/components/ui/textarea";

const AudienceSection = ({ formData, onFormChange }) => {
  // Error dialog state
  const [errorDialog, setErrorDialog] = useState({
    isOpen: false,
    title: "",
    description: "",
  });

  // Loading state for file processing
  const [isProcessing, setIsProcessing] = useState(false);

  // Search state for existing audiences
  const [audienceSearch, setAudienceSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(audienceSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [audienceSearch]);

  // Get audiences from API
  const {
    data: audienceData,
    isLoading: isLoadingAudiences,
    error: audienceError,
  } = useGetAudienceQuery({
    search: debouncedSearch,
    limit: 50,
  });

  const showError = (title, description) => {
    setErrorDialog({
      isOpen: true,
      title,
      description,
    });
  };

  const handleAudienceTypeChange = (value) => {
    console.log("Audience type changed to:", value);
    onFormChange("audienceType", value);

    // Clear audience-related data when switching types
    if (value === "upload") {
      onFormChange("existingAudienceId", "");
      onFormChange("audienceContactCount", 0);
      onFormChange("manualPhoneNumbers", "");
    } else if (value === "existing") {
      onFormChange("audienceFile", null);
      onFormChange("audienceHeaders", []);
      onFormChange("availableMergeFields", []);
      onFormChange("audienceSampleData", []);
      onFormChange("manualPhoneNumbers", "");
    } else if (value === "manual") {
      onFormChange("audienceFile", null);
      onFormChange("existingAudienceId", "");
      onFormChange("audienceHeaders", []);
      onFormChange("availableMergeFields", []);
      onFormChange("audienceSampleData", []);
    }
  };

  const processFile = async (file) => {
    console.log("Processing file:", file.name);
    setIsProcessing(true);

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setIsProcessing(false);
      showError(
        "File Too Large",
        "Please upload a file smaller than 10MB. Large files can slow down processing and may cause issues."
      );
      return;
    }

    try {
      if (file.name.endsWith(".csv")) {
        // Process CSV files
        const text = await file.text();
        processCSV(text);
      } else if (file.name.match(/\.(xlsx|xls|ods)$/)) {
        // Process Excel files using xlsx library
        await processExcel(file);
      } else if (file.name.endsWith(".sheets")) {
        // Google Sheets files - show instruction to download as Excel
        setIsProcessing(false);
        showError(
          "Google Sheets Format",
          "Google Sheets (.sheets) files cannot be processed directly. Please download your Google Sheet as an Excel (.xlsx) file and upload that instead."
        );
        return;
      } else {
        throw new Error(
          "Unsupported file format. Please upload CSV, Excel (.xlsx/.xls), or OpenDocument (.ods) files."
        );
      }
    } catch (error) {
      console.error("Error processing file:", error);
      // Reset audience data on error
      onFormChange("audienceFile", null);
      onFormChange("audienceHeaders", []);
      onFormChange("audienceContactCount", 0);
      onFormChange("availableMergeFields", []);

      // Show error message to user with specific title
      if (error.message.includes("phone number")) {
        showError("Missing Phone Number Column", error.message);
      } else if (error.message.includes("empty")) {
        showError("Empty File", error.message);
      } else if (error.message.includes("headers only")) {
        showError("Headers Only", error.message);
      } else if (error.message.includes("Unsupported file format")) {
        showError("Unsupported Format", error.message);
      } else {
        showError("File Processing Error", error.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const processExcel = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });

          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convert to JSON with headers
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length === 0) {
            reject(new Error("Excel file is empty"));
            return;
          }

          if (jsonData.length === 1) {
            reject(
              new Error(
                "Excel file only contains headers. Please add contact data rows."
              )
            );
            return;
          }

          // Extract headers from first row and clean them
          const headers = jsonData[0].map((header, index) => {
            if (!header || String(header).trim() === "") {
              return `Column${index + 1}`;
            }
            return String(header).trim();
          });

          // Validate that we have at least one required field
          const hasRequiredField = headers.some((header) =>
            isRequiredField(
              header
                .toLowerCase()
                .replace(/\s+/g, "")
                .replace(/[^a-z0-9]/g, "")
            )
          );

          if (!hasRequiredField) {
            reject(
              new Error(
                "No phone number column found. Please ensure your file has a column for phone numbers (e.g., 'Phone', 'Mobile', 'WhatsApp')."
              )
            );
            return;
          }

          // Count contacts (excluding header row and empty rows)
          const contactCount = jsonData
            .slice(1)
            .filter((row) =>
              row.some(
                (cell) =>
                  cell !== null &&
                  cell !== undefined &&
                  String(cell).trim() !== ""
              )
            ).length;

          if (contactCount === 0) {
            reject(
              new Error(
                "No valid contact data found. Please check that your file contains contact information."
              )
            );
            return;
          }

          // Create merge fields mapping
          const mergeFields = headers.map((header) => {
            const field = header
              .toLowerCase()
              .replace(/\s+/g, "")
              .replace(/[^a-z0-9]/g, "");
            return {
              field,
              label: header,
              required: isRequiredField(field),
            };
          });

          // Extract first row data for preview
          const firstRowData = jsonData[1]; // First data row (index 1, after headers)
          const sampleData = firstRowData
            ? firstRowData.map((cell) =>
                cell !== null && cell !== undefined ? String(cell).trim() : ""
              )
            : [];

          console.log("Excel processed successfully:");
          console.log("- Headers:", headers);
          console.log("- Contact count:", contactCount);
          console.log("- Merge fields:", mergeFields);
          console.log("- Sample data (first row):", sampleData);

          // Update form data
          onFormChange("audienceHeaders", headers);
          onFormChange("audienceContactCount", contactCount);
          onFormChange("availableMergeFields", mergeFields);
          onFormChange("audienceSampleData", sampleData);

          resolve();
        } catch (error) {
          reject(new Error(`Failed to parse Excel file: ${error.message}`));
        }
      };

      reader.onerror = () =>
        reject(new Error("Failed to read file. Please try again."));
      reader.readAsArrayBuffer(file);
    });
  };

  const processCSV = (csvText) => {
    const lines = csvText.split("\n").filter((line) => line.trim() !== "");
    if (lines.length === 0) {
      showError(
        "Empty CSV File",
        "The CSV file is empty. Please check your file and ensure it contains data."
      );
      return;
    }

    if (lines.length === 1) {
      showError(
        "Headers Only",
        "The CSV file only contains headers. Please add contact data rows below the header row."
      );
      return;
    }

    // Extract headers from first line
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));

    // Validate that we have at least one required field
    const hasRequiredField = headers.some((header) =>
      isRequiredField(
        header
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace(/[^a-z0-9]/g, "")
      )
    );

    if (!hasRequiredField) {
      showError(
        "Missing Phone Number Column",
        "No phone number column found. Please ensure your file has a column for phone numbers (e.g., 'Phone', 'Mobile', 'WhatsApp', 'Contact')."
      );
      return;
    }

    // Count contacts (excluding header row and empty rows)
    const contactCount = lines
      .slice(1)
      .filter((line) =>
        line.split(",").some((cell) => cell.trim() !== "")
      ).length;

    if (contactCount === 0) {
      showError(
        "No Contact Data",
        "No valid contact data found. Please check that your file contains contact information below the header row."
      );
      return;
    }

    // Create merge fields mapping
    const mergeFields = headers.map((header) => {
      const field = header
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9]/g, "");
      return {
        field,
        label: header,
        required: isRequiredField(field),
      };
    });

    // Extract first row data for preview
    const firstRowData = lines[1]
      ? lines[1].split(",").map((cell) => cell.trim().replace(/"/g, ""))
      : [];
    const sampleData = firstRowData.map((cell) => cell || "");

    console.log("CSV processed successfully:");
    console.log("- Headers:", headers);
    console.log("- Contact count:", contactCount);
    console.log("- Merge fields:", mergeFields);
    console.log("- Sample data (first row):", sampleData);

    // Update form data
    onFormChange("audienceHeaders", headers);
    onFormChange("audienceContactCount", contactCount);
    onFormChange("availableMergeFields", mergeFields);
    onFormChange("audienceSampleData", sampleData);
  };

  const isRequiredField = (field) => {
    const requiredPatterns = [
      "phone",
      "phonenumber",
      "mobile",
      "cell",
      "cellphone",
      "whatsapp",
      "wa",
      "contact",
      "number",
      "tel",
      "telephone",
    ];

    return requiredPatterns.some((pattern) => field.includes(pattern));
  };

  const handleFileUpload = (file) => {
    console.log("Audience file uploaded:", file);
    onFormChange("audienceFile", file);

    // Process the file immediately
    processFile(file);
  };

  const handleFileRemove = () => {
    onFormChange("audienceFile", null);
    onFormChange("audienceHeaders", []);
    onFormChange("audienceContactCount", 0);
    onFormChange("availableMergeFields", []);
  };

  const handleExistingAudienceSelection = (audienceId) => {
    console.log("Existing audience selected:", audienceId);
    onFormChange("existingAudienceId", audienceId);

    // Find the selected audience and update contact count and merge fields
    if (audienceData?.audiences) {
      const selectedAudience = audienceData.audiences.find(
        (audience) => audience._id === audienceId
      );
      if (selectedAudience) {
        onFormChange("audienceContactCount", selectedAudience.count || 0);
        onFormChange(
          "availableMergeFields",
          selectedAudience.availableMergeFields || []
        );
        console.log("Updated contact count:", selectedAudience.count || 0);
        console.log(
          "Updated merge fields:",
          selectedAudience.availableMergeFields || []
        );
      }
    }
  };

  const handleSaveAudienceToggle = (saveForFuture) => {
    console.log("Save audience for future:", saveForFuture);
    onFormChange("saveAudienceForFuture", saveForFuture);
  };

  const handleManualPhoneNumbersChange = (value) => {
    console.log("Manual phone numbers changed:", value);
    onFormChange("manualPhoneNumbers", value);

    // Parse phone numbers and count them
    if (value.trim()) {
      const phoneNumbers = value
        .split(",")
        .map((num) => num.trim())
        .filter((num) => num.length > 0);

      onFormChange("audienceContactCount", phoneNumbers.length);

      // For manual entry, we don't need merge fields, headers, or sample data
      // Just set basic structure for phone numbers
      onFormChange("availableMergeFields", []);
      onFormChange("audienceHeaders", []);
      onFormChange("audienceSampleData", []);
    } else {
      onFormChange("audienceContactCount", 0);
      onFormChange("availableMergeFields", []);
      onFormChange("audienceHeaders", []);
      onFormChange("audienceSampleData", []);
    }
  };

  const renderFileUploadForm = () => (
    <div className="space-y-4">
      {!formData.audienceFile ? (
        // Show upload area only when no file is selected
        <div className="space-y-2">
          <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
            <Upload className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
            Upload Contacts File <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              type="file"
              id="audience-file-upload"
              className="hidden"
              accept=".xlsx,.xls,.csv,.sheets,.ods"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleFileUpload(file);
                }
              }}
            />
            <label
              htmlFor="audience-file-upload"
              className="border-2 border-dashed border-wa-border-light dark:border-wa-border-dark rounded-lg p-6 text-center hover:border-wa-brand/50 transition-colors cursor-pointer block"
            >
              <div className="space-y-2">
                <Upload className="w-8 h-8 mx-auto text-wa-icon-light dark:text-wa-icon-dark" />
                <p className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Supports: Excel (.xlsx, .xls), CSV, Google Sheets (.sheets),
                  OpenDocument (.ods)
                </p>
              </div>
            </label>
          </div>
        </div>
      ) : (
        // Show file details and available variables when file is selected
        <div className="space-y-4">
          {/* File Information */}
          <div className="bg-wa-brand/5 dark:bg-wa-brand/10 p-4 rounded-lg border border-wa-brand/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Table className="w-5 h-5 text-wa-brand" />
                <div>
                  <h4 className="font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark">
                    {formData.audienceFile.name}
                  </h4>
                  <p className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                    {formData.audienceContactCount} contacts •{" "}
                    {formData.audienceHeaders.length} columns
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleFileRemove}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Available Variables from File */}
          {formData.availableMergeFields &&
            formData.availableMergeFields.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
                  Available Variables from File
                </label>
                <div className="flex flex-wrap gap-2">
                  {formData.availableMergeFields.map((field, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {field.label}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  These variables can be used in your message for
                  personalization.
                </p>
              </div>
            )}
        </div>
      )}

      {/* Save for Future Use Checkbox - Only show when file is uploaded */}
      {formData.audienceFile && (
        <div className="space-y-2">
          <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-wa-brand has-[[aria-checked=true]]:bg-wa-brand/5 dark:has-[[aria-checked=true]]:border-wa-brand dark:has-[[aria-checked=true]]:bg-wa-brand/10">
            <Checkbox
              id="save-audience-checkbox"
              checked={formData.saveAudienceForFuture || false}
              onCheckedChange={handleSaveAudienceToggle}
              className="data-[state=checked]:border-wa-brand data-[state=checked]:bg-wa-brand data-[state=checked]:text-white dark:data-[state=checked]:border-wa-brand dark:data-[state=checked]:bg-wa-brand"
            />
            <div className="grid gap-1.5 font-normal">
              <p className="text-sm leading-none font-medium">
                Save this audience for future use
              </p>
              <p className="text-muted-foreground text-sm">
                You can reuse this contact list in future campaigns
              </p>
            </div>
          </Label>
        </div>
      )}

      {/* Processing Spinner */}
      {isProcessing && (
        <div className="bg-wa-brand/5 dark:bg-wa-brand/10 p-6 rounded-lg border border-wa-brand/20">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Spinner size={32} theme="brand" animation="pulse" />
            <div className="text-center">
              <p className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark">
                Processing your file...
              </p>
              <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                This may take a moment for larger files
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderExistingAudienceForm = () => (
    <div className="space-y-4">
      {!formData.existingAudienceId ? (
        // Show audience selection when none is selected
        <div className="space-y-2">
          <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
            <Users className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
            Select Existing Audience{" "}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="space-y-3">
            {/* Audience Selection with Search */}
            <Select
              value={formData.existingAudienceId || ""}
              onValueChange={handleExistingAudienceSelection}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Search and select an audience" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search audiences..."
                      className="pl-8"
                      value={audienceSearch}
                      onChange={(e) => {
                        setAudienceSearch(e.target.value);
                      }}
                    />
                  </div>
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {isLoadingAudiences ? (
                    <div className="flex items-center justify-center p-4">
                      <Spinner size={20} theme="brand" />
                      <span className="ml-2 text-sm text-gray-500">
                        Loading...
                      </span>
                    </div>
                  ) : audienceError ? (
                    <div className="p-4 text-center text-sm text-red-500">
                      Failed to load audiences
                    </div>
                  ) : audienceData?.audiences?.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      {audienceSearch
                        ? "No audiences found matching your search"
                        : "No audiences available"}
                    </div>
                  ) : (
                    audienceData?.audiences?.map((audience) => (
                      <SelectItem key={audience._id} value={audience._id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{audience.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {audience.count || 0} contacts • Last used{" "}
                            {audience.lastUsed
                              ? longAgo(audience.lastUsed)
                              : "Never"}
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
      ) : (
        // Show selected audience details
        <div className="space-y-4">
          {/* Audience Information */}
          <div className="bg-wa-brand/5 dark:bg-wa-brand/10 p-4 rounded-lg border border-wa-brand/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-wa-brand" />
                <div>
                  <h4 className="font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark">
                    {audienceData?.audiences?.find(
                      (a) => a._id === formData.existingAudienceId
                    )?.name || "Selected Audience"}
                  </h4>
                  <p className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                    {formData.audienceContactCount || 0} contacts • Existing
                    audience
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onFormChange("existingAudienceId", "");
                  onFormChange("audienceContactCount", 0);
                  onFormChange("availableMergeFields", []);
                }}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Available Variables from Audience */}
          {formData.availableMergeFields &&
            formData.availableMergeFields.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
                  Available Variables from Audience
                </label>
                <div className="flex flex-wrap gap-2">
                  {formData.availableMergeFields.map((field, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {field.label}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  These variables can be used in your message for
                  personalization.
                </p>
              </div>
            )}

          {/* Template-Audience Variable Mismatch Warning */}
          {(() => {
            // This will be populated from the parent component when template is selected
            if (
              !formData.templateId ||
              !formData.availableMergeFields ||
              formData.availableMergeFields.length === 0
            ) {
              return null;
            }

            // For now, we'll show a general note about ensuring compatibility
            return (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg
                    className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    Layers
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    <span className="font-medium">Compatibility Note:</span>{" "}
                    Ensure your audience has the variables used in your
                    template. Variables not found in the audience will appear as
                    plain text in messages.
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );

  const renderManualEntryForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark flex items-center">
          <Edit3 className="w-4 h-4 mr-2 text-wa-icon-light dark:text-wa-icon-dark" />
          Enter Phone Numbers <span className="text-red-500 ml-1">*</span>
        </label>
        <Textarea
          placeholder="Enter phone numbers separated by commas (e.g., +1234567890, +0987654321, 5551234567)"
          value={formData.manualPhoneNumbers || ""}
          onChange={(e) => handleManualPhoneNumbersChange(e.target.value)}
          className="w-full min-h-[120px] font-mono text-sm"
        />
        <div className="flex items-center justify-between text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
          <span>
            {formData.audienceContactCount || 0} phone number(s) entered
          </span>
          <span className="text-wa-brand">
            Format: +1234567890, 0987654321, 5551234567
          </span>
        </div>
      </div>

      {/* Save for Future Use Checkbox - Only show when numbers are entered */}
      {formData.manualPhoneNumbers?.trim() && (
        <div className="space-y-2">
          <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-wa-brand has-[[aria-checked=true]]:bg-wa-brand/5 dark:has-[[aria-checked=true]]:border-wa-brand dark:has-[[aria-checked=true]]:bg-wa-brand/10">
            <Checkbox
              id="save-manual-audience-checkbox"
              checked={formData.saveAudienceForFuture || false}
              onCheckedChange={handleSaveAudienceToggle}
              className="data-[state=checked]:border-wa-brand data-[state=checked]:bg-wa-brand data-[state=checked]:text-white dark:data-[state=checked]:border-wa-brand dark:data-[state=checked]:bg-wa-brand"
            />
            <div className="grid gap-1.5 font-normal">
              <p className="text-sm leading-none font-medium">
                Save this audience for future use
              </p>
              <p className="text-muted-foreground text-sm">
                You can reuse this contact list in future campaigns
              </p>
            </div>
          </Label>
        </div>
      )}
    </div>
  );

  const renderAudienceContentByType = (audienceType) => {
    switch (audienceType) {
      case "upload":
        return renderFileUploadForm();
      case "existing":
        return renderExistingAudienceForm();
      case "manual":
        return renderManualEntryForm();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Audience Type Selection with Enhanced Radio Buttons */}
      <div className="space-y-4">
        <RadioGroup
          value={formData.audienceType || ""}
          onValueChange={handleAudienceTypeChange}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          {/* Manual Entry Option */}
          <div className="group relative">
            <RadioGroupItem value="manual" id="manual" className="sr-only" />
            <Label
              htmlFor="manual"
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                formData.audienceType === "manual"
                  ? "border-wa-brand bg-wa-brand/5 dark:bg-wa-brand/10 shadow-sm"
                  : "border-wa-border-light dark:border-wa-border-dark hover:border-wa-brand/30 hover:bg-wa-brand/5 dark:hover:bg-wa-brand/10"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-200 ${
                  formData.audienceType === "manual"
                    ? "bg-wa-brand text-white"
                    : "bg-wa-brand/10 text-wa-brand"
                }`}
              >
                <Edit3 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  Manual Entry
                </div>
                <div className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Type phone numbers manually
                </div>
              </div>
            </Label>
          </div>

          {/* Upload File Option */}
          <div className="group relative">
            <RadioGroupItem value="upload" id="upload" className="sr-only" />
            <Label
              htmlFor="upload"
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                formData.audienceType === "upload"
                  ? "border-wa-brand bg-wa-brand/5 dark:bg-wa-brand/10 shadow-sm"
                  : "border-wa-border-light dark:border-wa-border-dark hover:border-wa-brand/30 hover:bg-wa-brand/5 dark:hover:bg-wa-brand/10"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-200 ${
                  formData.audienceType === "upload"
                    ? "bg-wa-brand text-white"
                    : "bg-wa-brand/10 text-wa-brand"
                }`}
              >
                <Upload className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  Upload File
                </div>
                <div className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Import contacts from Excel, CSV, or Sheets
                </div>
              </div>
            </Label>
          </div>

          {/* Existing Audience Option */}
          <div className="group relative">
            <RadioGroupItem
              value="existing"
              id="existing"
              className="sr-only"
            />
            <Label
              htmlFor="existing"
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                formData.audienceType === "existing"
                  ? "border-wa-brand bg-wa-brand/5 dark:bg-wa-brand/10 shadow-sm"
                  : "border-wa-border-light dark:border-wa-border-dark hover:border-wa-brand/30 hover:bg-wa-brand/5 dark:hover:bg-wa-brand/10"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-200 ${
                  formData.audienceType === "existing"
                    ? "bg-wa-brand text-white"
                    : "bg-wa-brand/10 text-wa-brand"
                }`}
              >
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  Existing Audience
                </div>
                <div className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Choose from your saved contact lists
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Manual Audience Limitation Note */}
      {formData.audienceType === "manual" && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-amber-600 dark:text-amber-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                Manual Audience Limitations
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Manual entry only supports basic messages. For personalized
                campaigns with variables, use "Upload File" with CSV/Excel or
                use "Existing Audience".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Content Based on Audience Type */}
      {formData.audienceType &&
        renderAudienceContentByType(formData.audienceType)}

      {/* Audience Loading Error */}
      {audienceError && formData.audienceType === "existing" && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            Failed to load audiences
          </h4>
          <p className="text-sm text-red-700 dark:text-red-300">
            {audienceError?.data?.message ||
              audienceError?.error ||
              "Please try refreshing the page"}
          </p>
        </div>
      )}

      {/* Error Dialog */}
      <AlertDialogComponent
        isOpen={errorDialog.isOpen}
        onClose={() => setErrorDialog({ ...errorDialog, isOpen: false })}
        type="error"
        title={errorDialog.title}
        description={errorDialog.description}
        buttonText="Got it"
      />

      {/* Full-screen Processing Overlay */}
      {isProcessing && (
        <div
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center"
          style={{
            margin: 0,
            padding: 0,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md mx-4">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Spinner size={48} theme="brand" animation="pulse" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Processing Your File
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Please wait while we extract contact information and validate
                  your data...
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  This may take a moment for larger files
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudienceSection;
