import Template from "../../template.model.js";

const getTemplates = async (userId, query = {}, session = null) => {
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

    let templateQuery;
    if (session) {
      templateQuery = Template.find(searchQuery)
        .sort(sortOptions)
        .limit(limit)
        .skip(skip)
        .session(session);
    } else {
      templateQuery = Template.find(searchQuery)
        .sort(sortOptions)
        .limit(limit)
        .skip(skip);
    }

    const templates = await templateQuery;

    // Get total count for pagination
    let totalCount;
    if (session) {
      totalCount = await Template.countDocuments(searchQuery).session(session);
    } else {
      totalCount = await Template.countDocuments(searchQuery);
    }
    return {
      templates,
      totalCount,
      hasMore: totalCount > skip + templates.length,
    };
  } catch (error) {
    throw new Error(`Failed to get templates: ${error.message}`);
  }
};

export default getTemplates;
