import User from "../../user.model.js";

export const findUserById = async (id, session = null) => {
  try {
    if (session) {
      const user = await User.findById(id).session(session);
      return user;
    } else {
      const user = await User.findById(id);
      return user;
    }
  } catch (error) {
    throw new Error("Failed to find user by id");
  }
};

export default findUserById;
