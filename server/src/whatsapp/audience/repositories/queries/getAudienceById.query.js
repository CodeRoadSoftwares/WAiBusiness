import Audience from "../../audience.model.js";

export const getAudienceById = async (userId, audienceId, session = null) => {
  try {
    let audienceQuery;
    if (session) {
      audienceQuery = Audience.findOne({ userId, _id: audienceId }).session(
        session
      );
    } else {
      audienceQuery = Audience.findOne({ userId, _id: audienceId });
    }

    const audience = await audienceQuery;

    if (!audience) {
      return null;
    }

    // Extract available variables from recipients
    let availableMergeFields = [];
    if (audience.recipients && audience.recipients.length > 0) {
      // Get all unique variable keys from all recipients
      const allVariables = new Set();
      audience.recipients.forEach((recipient) => {
        if (recipient.variables && typeof recipient.variables === "object") {
          // Handle both Map and regular object
          if (recipient.variables instanceof Map) {
            recipient.variables.forEach((value, key) => {
              if (key && key !== "phone" && key !== "name") {
                allVariables.add(key);
              }
            });
          } else {
            Object.keys(recipient.variables).forEach((key) => {
              if (key && key !== "phone" && key !== "name") {
                allVariables.add(key);
              }
            });
          }
        }
      });

      // Convert to merge field format
      availableMergeFields = Array.from(allVariables).map((field) => ({
        field: field,
        label: field.charAt(0).toUpperCase() + field.slice(1), // Capitalize first letter
        required: false,
      }));

      // Add phone field as required
      availableMergeFields.unshift({
        field: "phone",
        label: "Phone",
        required: true,
      });

      // Add name field if it exists
      if (allVariables.has("name") || audience.recipients.some((r) => r.name)) {
        availableMergeFields.push({
          field: "name",
          label: "Name",
          required: false,
        });
      }
    }

    // Return audience with available variables
    return {
      _id: audience._id,
      name: audience.name,
      description: audience.description,
      recipients: audience.recipients,
      count: audience.count,
      lastUsed: audience.lastUsed,
      availableMergeFields: availableMergeFields,
      createdAt: audience.createdAt,
      updatedAt: audience.updatedAt,
    };
  } catch (error) {
    throw new Error(`Failed to get audience by id: ${error.message}`);
  }
};
