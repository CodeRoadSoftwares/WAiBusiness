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
        .select("_id name count lastUsed")
        .session(session);
    } else {
      audienceQuery = Audience.find(searchQuery)
        .sort(sortOptions)
        .limit(limit)
        .skip(skip)
        .select("_id name count lastUsed");
    }

    const audience = await audienceQuery;

    // Get total count for pagination
    let totalCount;
    if (session) {
      totalCount = await Audience.countDocuments(searchQuery).session(session);
    } else {
      totalCount = await Audience.countDocuments(searchQuery);
    }

    return {
      audiences: audience,
      totalCount,
      hasMore: totalCount > skip + audience.length,
    };
  } catch (error) {
    throw new Error(`Failed to get audience: ${error.message}`);
  }
};
