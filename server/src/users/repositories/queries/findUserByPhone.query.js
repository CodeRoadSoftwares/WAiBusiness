import User from "../../user.model.js";

export const findUserByPhone = async (phone, session = null) => {
  try {
    // If session is provided, use it for the transaction
    if (session) {
      const user = await User.findOne({ phone }).session(session);
      return user;
    } else {
      // Fallback for non-transactional operations
      const user = await User.findOne({ phone });
      return user;
    }
  } catch (error) {
    throw new Error("Failed to find user");
  }
};
