import Audience from "../../audience.model.js";

export const getAudience = async (userId, query = {}, session = null) => {
  try {
    let searchQuery = { userId };

    // If search query is provided, add text search for name
    if (query.search && query.search.trim()) {
      searchQuery.name = {
        $regex: query.search.trim(),
        $options: "i", // Case-insensitive search
      };
    }

    // Add pagination if provided
    const limit = query.limit ? parseInt(query.limit) : 20;
    const skip = query.skip ? parseInt(query.skip) : 0;

    // Sort by last used (most recent first)
    const sortOptions = { lastUsed: -1, createdAt: -1 };

    let audienceQuery;
    if (session) {
      audienceQuery = Audience.find(searchQuery)
        .sort(sortOptions)
        .limit(limit)
        .skip(skip)
        .select("_id name count lastUsed recipients")
        .session(session);
    } else {
      audienceQuery = Audience.find(searchQuery)
        .sort(sortOptions)
        .limit(limit)
        .skip(skip)
        .select("_id name count lastUsed recipients");
    }

    const audience = await audienceQuery;

    // Process audience data to extract available variables
    const processedAudience = audience.map((audienceItem) => {
      const audienceData = audienceItem.toObject();

      // Extract available variables from recipients
      let availableMergeFields = [];
      if (audienceData.recipients && audienceData.recipients.length > 0) {
        // Get all unique variable keys from all recipients
        const allVariables = new Set();
        audienceData.recipients.forEach((recipient) => {
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
        if (
          allVariables.has("name") ||
          audienceData.recipients.some((r) => r.name)
        ) {
          availableMergeFields.push({
            field: "name",
            label: "Name",
            required: false,
          });
        }
      }

      return {
        _id: audienceData._id,
        name: audienceData.name,
        count: audienceData.count,
        lastUsed: audienceData.lastUsed,
        availableMergeFields: availableMergeFields,
      };
    });

    // Get total count for pagination
    let totalCount;
    if (session) {
      totalCount = await Audience.countDocuments(searchQuery).session(session);
    } else {
      totalCount = await Audience.countDocuments(searchQuery);
    }

    return {
      audiences: processedAudience,
      totalCount,
      hasMore: totalCount > skip + audience.length,
    };
  } catch (error) {
    throw new Error(`Failed to get audience: ${error.message}`);
  }
};
