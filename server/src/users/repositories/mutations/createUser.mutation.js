import User from "../../user.model.js";

export const createUser = async (userData, session = null) => {
  try {
    if (session) {
      try {
        const user = await User.create([userData], { session });
        if (user && user.length > 0) {
          return user[0];
        } else {
          throw new Error("User creation returned empty result");
        }
      } catch (createError) {
        throw createError;
      }
    } else {
      // Fallback for non-transactional operations
      const user = await User.create(userData);
      return user;
    }
  } catch (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
};
