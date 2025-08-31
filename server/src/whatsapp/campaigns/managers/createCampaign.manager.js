import { CampaignRepository } from "../repositories/campaign.repository.js";
import { TransactionManager } from "../../../utils/transaction.util.js";
import {
  getFileUrl,
  cleanupTempFile,
  saveMediaFileToDisk,
} from "../../../middlewares/fileUpload.middleware.js";
import AudienceFileProcessor from "../../audience/services/audienceFileProcessor.service.js";
import { AudienceRepository } from "../../audience/repositories/audience.repository.js";
import fs from "fs";
import path from "path";
import { TemplateRepository } from "../../template/repositories/template.repository.js";

const createCampaignManager = async (userId, campaignData, files = {}) => {
  let savedMediaFile = null; // Track saved file for cleanup

  try {
    const campaign = await TransactionManager.executeTransaction(
      async (session) => {
        let campaignDataForModel = {};
        campaignDataForModel.userId = userId;
        campaignDataForModel.name = campaignData.name;
        campaignDataForModel.description = campaignData.description;
        campaignDataForModel.campaignType = campaignData.campaignType;
        campaignDataForModel.audienceType = campaignData.audienceType;

        let audienceData = null;

        // Handle audience data based on audienceType
        if (campaignData.audienceType === "upload") {
          // Process audience file if uploaded (don't store, just process)
          if (files.audienceFile && files.audienceFile[0]) {
            const audienceFile = files.audienceFile[0];

            // Get availableMergeFields from campaign data and parse if it's a JSON string
            let availableMergeFields = campaignData.availableMergeFields || [];
            if (typeof availableMergeFields === "string") {
              try {
                availableMergeFields = JSON.parse(availableMergeFields);
              } catch (error) {
                console.warn("Failed to parse availableMergeFields:", error);
                availableMergeFields = [];
              }
            }

            audienceData = await AudienceFileProcessor.processAudienceFile(
              audienceFile.buffer,
              audienceFile.originalname,
              availableMergeFields
            );
          }
        } else if (campaignData.audienceType === "existing") {
          // Fetch existing audience by ID
          if (campaignData.existingAudienceId) {
            const existingAudience = await AudienceRepository.getAudienceById(
              userId,
              campaignData.existingAudienceId,
              session
            );

            if (!existingAudience) {
              throw new Error("Selected audience not found");
            }

            // Convert existing audience to the format expected by the campaign
            audienceData = {
              audience: existingAudience.recipients || [],
              validRows: existingAudience.recipients?.length || 0,
              totalRows: existingAudience.recipients?.length || 0,
              invalidRows: 0,
            };
          } else {
            throw new Error("Existing audience ID is required");
          }
        } else if (campaignData.audienceType === "manual") {
          // Process manually entered phone numbers
          if (
            campaignData.manualPhoneNumbers &&
            campaignData.manualPhoneNumbers.trim()
          ) {
            const phoneNumbers = campaignData.manualPhoneNumbers
              .split(",")
              .map((num) => num.trim())
              .filter((num) => num.length > 0);

            if (phoneNumbers.length === 0) {
              throw new Error("Please enter at least one valid phone number");
            }

            // Convert phone numbers to audience format with proper structure
            const audience = phoneNumbers.map((phone) => ({
              phone: phone,
              name: phone, // Use phone as name if no name provided
              variables: {}, // Empty variables object that getAudienceStats expects
            }));

            console.log("Audience data:", audience);

            audienceData = {
              audience: audience,
              validRows: audience.length,
              totalRows: audience.length,
              invalidRows: 0,
            };
          } else {
            throw new Error("Please enter phone numbers manually");
          }
        }

        // Validate audience data
        if (!audienceData || audienceData.validRows === 0) {
          throw new Error("Valid audience data is required");
        }

        // Create Message with media file handling
        if (
          campaignData.abTesting !== true &&
          campaignData.abTesting !== "true"
        ) {
          campaignDataForModel.messageVariants = [];
          if (campaignData.messageType === "template") {
            const template = await TemplateRepository.getTemplateById(
              userId,
              campaignData.templateId,
              session
            );
            if (!template) {
              throw new Error("Template not found");
            }

            campaignDataForModel.messageVariants.push({
              variantName: "Single",
              type: "template",
              templateId: template._id,
              recipients: [],
              metrics: {}, // Initialize metrics object
            });
          } else if (campaignData.messageType === "text") {
            campaignDataForModel.messageVariants.push({
              variantName: "Single",
              type: "text",
              message: campaignData.messageContent,
              recipients: [],
              metrics: {}, // Initialize metrics object
            });
          } else if (campaignData.messageType === "media") {
            // Handle media file upload
            if (files.mediaFile && files.mediaFile[0]) {
              const mediaFile = files.mediaFile[0];

              // Debug logging
              console.log("Media file details:", {
                originalname: mediaFile.originalname,
                mimetype: mediaFile.mimetype,
                size: mediaFile.size,
              });

              // Correct MIME type for common file extensions
              const fileName = mediaFile.originalname.toLowerCase();
              if (fileName.endsWith(".csv")) {
                mediaFile.mimetype = "text/csv";
                console.log("Corrected MIME type for CSV file to: text/csv");
              } else if (fileName.endsWith(".xlsx")) {
                mediaFile.mimetype =
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                console.log("Corrected MIME type for XLSX file");
              } else if (fileName.endsWith(".xls")) {
                mediaFile.mimetype = "application/vnd.ms-excel";
                console.log("Corrected MIME type for XLS file");
              }

              // Save media file to disk only after validation passes
              const savedFile = await saveMediaFileToDisk(mediaFile);
              savedMediaFile = savedFile; // Track for potential cleanup

              campaignDataForModel.messageVariants.push({
                variantName: "Single",
                type: "media",
                media: {
                  url: savedFile.url,
                  type: (() => {
                    const fileName = mediaFile.originalname.toLowerCase();
                    const extension = path.extname(fileName);

                    // Use extension as primary source of truth
                    if (
                      [
                        ".jpg",
                        ".jpeg",
                        ".png",
                        ".gif",
                        ".webp",
                        ".bmp",
                        ".svg",
                      ].includes(extension)
                    )
                      return "image";
                    if (
                      [
                        ".mp4",
                        ".avi",
                        ".mov",
                        ".wmv",
                        ".flv",
                        ".mkv",
                        ".webm",
                      ].includes(extension)
                    )
                      return "video";
                    if (
                      [
                        ".mp3",
                        ".wav",
                        ".m4a",
                        ".aac",
                        ".ogg",
                        ".flac",
                      ].includes(extension)
                    )
                      return "audio";
                    if (
                      [
                        ".csv",
                        ".xlsx",
                        ".xls",
                        ".pdf",
                        ".docx",
                        ".doc",
                        ".txt",
                        ".rtf",
                      ].includes(extension)
                    )
                      return "document";

                    // Fallback to MIME type if extension not recognized
                    const mime = mediaFile.mimetype;
                    if (mime.startsWith("image/")) return "image";
                    if (mime.startsWith("video/")) return "video";
                    if (mime.startsWith("audio/")) return "audio";

                    // Default to document for other types
                    return "document";
                  })(),
                  fileName: mediaFile.originalname,
                  mimeType: mediaFile.mimetype,
                },
                recipients: [],
                metrics: {}, // Initialize metrics object
              });
            } else {
              throw new Error("Media file is required for media type campaign");
            }
          } else if (campaignData.messageType === "mixed") {
            // Handle mixed media and text
            if (files.mediaFile && files.mediaFile[0]) {
              const mediaFile = files.mediaFile[0];

              // Debug logging
              console.log("Mixed media file details:", {
                originalname: mediaFile.originalname,
                mimetype: mediaFile.mimetype,
                size: mediaFile.size,
              });

              // Correct MIME type for common file extensions
              const fileName = mediaFile.originalname.toLowerCase();
              if (fileName.endsWith(".csv")) {
                mediaFile.mimetype = "text/csv";
                console.log("Corrected MIME type for CSV file to: text/csv");
              } else if (fileName.endsWith(".xlsx")) {
                mediaFile.mimetype =
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                console.log("Corrected MIME type for XLSX file");
              } else if (fileName.endsWith(".xls")) {
                mediaFile.mimetype = "application/vnd.ms-excel";
                console.log("Corrected MIME type for XLS file");
              }

              // Save media file to disk only after validation passes
              const savedFile = await saveMediaFileToDisk(mediaFile);
              savedMediaFile = savedFile; // Track for potential cleanup

              campaignDataForModel.messageVariants.push({
                variantName: "Single",
                type: "mixed",
                message: campaignData.messageContent,
                media: {
                  url: savedFile.url,
                  type: (() => {
                    const fileName = mediaFile.originalname.toLowerCase();
                    const extension = path.extname(fileName);

                    // Use extension as primary source of truth
                    if (
                      [
                        ".jpg",
                        ".jpeg",
                        ".png",
                        ".gif",
                        ".webp",
                        ".bmp",
                        ".svg",
                      ].includes(extension)
                    )
                      return "image";
                    if (
                      [
                        ".mp4",
                        ".avi",
                        ".mov",
                        ".wmv",
                        ".flv",
                        ".mkv",
                        ".webm",
                      ].includes(extension)
                    )
                      return "video";
                    if (
                      [
                        ".mp3",
                        ".wav",
                        ".m4a",
                        ".aac",
                        ".ogg",
                        ".flac",
                      ].includes(extension)
                    )
                      return "audio";
                    if (
                      [
                        ".csv",
                        ".xlsx",
                        ".xls",
                        ".pdf",
                        ".docx",
                        ".doc",
                        ".txt",
                        ".rtf",
                      ].includes(extension)
                    )
                      return "document";

                    // Fallback to MIME type if extension not recognized
                    const mime = mediaFile.mimetype;
                    if (mime.startsWith("image/")) return "image";
                    if (mime.startsWith("video/")) return "video";
                    if (mime.startsWith("audio/")) return "audio";

                    // Default to document for other types
                    return "document";
                  })(),
                  fileName: mediaFile.originalname,
                  mimeType: mediaFile.mimetype,
                },
                recipients: [],
                metrics: {}, // Initialize metrics object
              });
            } else {
              throw new Error("Media file is required for mixed type campaign");
            }
          }

          campaignDataForModel.messageVariants[0].recipients.push(
            ...audienceData.audience
          );
          campaignDataForModel.messageVariants[0].metrics.totalRecipients =
            audienceData.validRows;
        }

        if (campaignData.scheduleType == "scheduled") {

          campaignDataForModel.scheduleType = "scheduled";
          campaignDataForModel.timeZone = campaignData.timeZone;
          campaignDataForModel.scheduledDate = campaignData.scheduledDate;
          campaignDataForModel.status = "scheduled";

        } else if (campaignData.scheduleType == "delayed") {

          campaignDataForModel.scheduleType = "delayed";
          campaignDataForModel.customDelay = campaignData.customDelay;
          campaignDataForModel.delayUnit = campaignData.delayUnit;
          campaignDataForModel.status = "scheduled";

        } else if (campaignData.scheduleType == "immediate") {

          campaignDataForModel.scheduleType = "immediate";
          campaignDataForModel.status = "running";
          
        }

        if (
          campaignData.saveAudienceForFuture === "true" ||
          campaignData.saveAudienceForFuture === true
        ) {
          // Save audience if it's from file upload or manual entry (not from existing audience)
          if (
            (campaignData.audienceType === "upload" ||
              campaignData.audienceType === "manual") &&
            audienceData?.audience
          ) {
            let audienceDataForModel = {};
            audienceDataForModel.userId = userId;
            audienceDataForModel.name = campaignData.name;
            audienceDataForModel.description = campaignData.description;
            audienceDataForModel.recipients = [...audienceData.audience];

            const audience = await AudienceRepository.createAudience(
              audienceDataForModel,
              session
            );
            campaignDataForModel.existingAudienceId = audience._id;
          }
        }

        const campaign = await CampaignRepository.createCampaign(
          campaignDataForModel,
          session
        );

        return {
          campaign,
          audienceStats: audienceData
            ? AudienceFileProcessor.getAudienceStats(audienceData.audience)
            : null,
        };
      }
    );

    return campaign;
  } catch (error) {
    // Clean up saved file if campaign creation failed
    if (savedMediaFile) {
      try {
        console.log(
          `Cleaning up saved file due to campaign creation failure: ${savedMediaFile.filename}`
        );

        // Check if file exists before trying to delete
        if (fs.existsSync(savedMediaFile.path)) {
          fs.unlinkSync(savedMediaFile.path);
          console.log(
            `Successfully cleaned up file: ${savedMediaFile.filename}`
          );
        } else {
          console.log(`File not found for cleanup: ${savedMediaFile.path}`);
        }
      } catch (cleanupError) {
        console.error(
          `Failed to clean up saved file ${savedMediaFile.filename}:`,
          cleanupError
        );
        // Don't throw cleanup errors - the main error is more important
      }
    }

    throw new Error(`Failed to create campaign: ${error.message}`);
  }
};

export default createCampaignManager;
