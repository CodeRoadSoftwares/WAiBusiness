// src/whatsapp/messageSender.service.js
import fs from "fs";
import path from "path";
import {
  getWhatsappClient,
  ensureWhatsappClient,
} from "../../sessions/services/whatsappsession.service.js";

// Helper: substitute variables in text using {{variable_name}} syntax
function substituteVariables(text, variables = {}) {
  if (!text || typeof text !== "string") return text;

  const originalText = text;
  const substitutedText = text.replace(
    /\{\{(\w+)\}\}/g,
    (match, variableName) => {
      const value = variables[variableName];
      if (value !== undefined) {
        // console.log(`🔄 Variable substitution: {{${variableName}}} → ${value}`);
        return value;
      } else {
        // console.log(
        // `⚠️ Variable not found: {{${variableName}}}, keeping as-is`
        // );
        return match;
      }
    }
  );

  return substitutedText;
}

// Helper: resolve media path relative to uploads directory
function resolveMediaPath(mediaPath) {
  if (!mediaPath) return null;

  // Check if it's a Windows absolute path (e.g., C:\folder\file)
  if (path.isAbsolute(mediaPath) && mediaPath.includes(":")) {
    return mediaPath;
  }

  // Handle URLs that start with /uploads/media/ or uploads/media/
  let cleanPath = mediaPath;
  if (cleanPath.startsWith("/uploads/media/")) {
    cleanPath = cleanPath.substring("/uploads/media/".length);
  } else if (cleanPath.startsWith("uploads/media/")) {
    cleanPath = cleanPath.substring("uploads/media/".length);
  }

  // Resolve from uploads directory
  const uploadsDir = path.join(process.cwd(), "uploads", "media");
  const finalPath = path.join(uploadsDir, cleanPath);

  return finalPath;
}

/**
 * Send a WhatsApp message of any supported type
 * @param {String} userId - The user who owns the WA session
 * @param {String} to - Recipient phone number (just digits, e.g., "919876543210")
 * @param {Object} message - Message object (type + content)
 * @param {Object} recipientVariables - Variables to substitute in the message
 */
export async function sendMessage(
  userId,
  to,
  message,
  recipientVariables = {}
) {
  try {
    let client = await ensureWhatsappClient(userId);

    // Normalize and validate recipient
    const digits = String(to).replace(/\D/g, "");
    let candidate = digits;
    // If 10-digit local number, infer country code from the logged-in account (e.g., 91...)
    if (candidate.length === 10 && client?.user?.id) {
      const myMsisdn = client.user.id.split(":")[0];
      // country code = everything before last 10 digits
      const cc = myMsisdn.slice(0, Math.max(0, myMsisdn.length - 10));
      if (cc) candidate = `${cc}${candidate}`;
    }

    const checkJid = candidate.includes("@s.whatsapp.net")
      ? candidate
      : `${candidate}@s.whatsapp.net`;

    const exists = await client.onWhatsApp(candidate);
    const isRegistered = Array.isArray(exists) && exists[0]?.exists === true;
    if (!isRegistered) {
      throw new Error(`Recipient not on WhatsApp: ${candidate}`);
    }

    const jid = checkJid;

    switch (message.type) {
      case "text":
        const substitutedText = substituteVariables(
          message.text,
          recipientVariables
        );
        await client.sendMessage(jid, { text: substitutedText });
        break;

      case "media":
        const mediaPath = resolveMediaPath(message.media.url);
        if (!mediaPath) {
          throw new Error("Media file not found or invalid path.");
        }
        const substitutedCaption = substituteVariables(
          message.media.caption || "",
          recipientVariables
        );

        // Handle different media types properly
        if (message.media.type === "document") {
         

          // For CSV files, ensure proper MIME type handling
          let finalMimeType =
            message.media.mimeType || "application/octet-stream";
          if (
            message.media.fileName &&
            message.media.fileName.toLowerCase().endsWith(".csv")
          ) {
            finalMimeType = "text/csv";
           
          }

          await client.sendMessage(jid, {
            document: fs.readFileSync(mediaPath),
            caption: substitutedCaption,
            fileName: message.media.fileName || "",
            mimetype: finalMimeType,
          });
        } else {
         
          await client.sendMessage(jid, {
            [message.media.type]: fs.readFileSync(mediaPath),
            caption: substitutedCaption,
            fileName: message.media.fileName || "",
            mimeType: message.media.mimeType || "",
          });
        }
        break;

      case "mixed":
        const mixedMediaPath = resolveMediaPath(message.media.url);
        if (!mixedMediaPath) {
          throw new Error("Media file not found or invalid path.");
        }
        const mixedSubstitutedText = substituteVariables(
          message.text || "",
          recipientVariables
        );

        // Handle different media types properly for mixed messages
        if (message.media.type === "document") {
          

          // For CSV files, ensure proper MIME type handling
          let finalMimeType =
            message.media.mimeType || "application/octet-stream";
          if (
            message.media.fileName &&
            message.media.fileName.toLowerCase().endsWith(".csv")
          ) {
            finalMimeType = "text/csv";
           
          }

          await client.sendMessage(jid, {
            document: fs.readFileSync(mixedMediaPath),
            caption: mixedSubstitutedText,
            fileName: message.media.fileName || "",
            mimetype: finalMimeType,
          });
        } else {
         
          await client.sendMessage(jid, {
            [message.media.type]: fs.readFileSync(mixedMediaPath),
            caption: mixedSubstitutedText,
            fileName: message.media.fileName || "",
            mimeType: message.media.mimeType || "",
          });
        }
        break;

      default:
        throw new Error(`Unsupported message type: ${message.type}`);
    }

  
    return { success: true };
  } catch (err) {
    console.error("❌ sendMessage error:", err.message);
    return { success: false, error: err.message };
  }
}
