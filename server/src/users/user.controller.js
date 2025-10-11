import { UserManager } from "./managers/user.manager.js";
import User from "./user.model.js";

const createUser = async (req, res) => {
  try {
    const user = await UserManager.createUserManager(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const UserController = {
  createUser,
  getUserProfile,
};
