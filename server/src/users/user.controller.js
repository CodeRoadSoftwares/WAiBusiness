import { UserManager } from "./managers/user.manager.js";

const createUser = async (req, res) => {
  try {
    const user = await UserManager.createUserManager(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const UserController = {
  createUser,
};
