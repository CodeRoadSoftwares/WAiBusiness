import Media from "../../media.model.js";

export const getMedia = async (userId, query = {}) => {
  try {
    const { page = 1, limit = 24, ...filterQuery } = query;
    const skip = (page - 1) * limit;

    const [media, totalCount] = await Promise.all([
      Media.find({ userId, ...filterQuery })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Media.countDocuments({ userId, ...filterQuery }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: media,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit,
      },
    };
  } catch (error) {
    throw new Error(`Failed to get media: ${error.message}`);
  }
};
