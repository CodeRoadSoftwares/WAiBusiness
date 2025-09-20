import { UserRepository } from "../repositories/user.repository.js";
import { TransactionManager } from "../../utils/transaction.util.js";
import crypto from "crypto";

const createUserManager = async (userData) => {
  try {
    // Execute all operations within a single transaction
    const user = await TransactionManager.executeTransaction(
      async (session) => {
        // validate user data
        if (
          !userData.firstName ||
          !userData.phone ||
          !userData.email ||
          !userData.password
        ) {
          throw new Error("Missing required fields");
        }

        // check if user already exists
        const existingUser = await UserRepository.findUserByPhone(
          userData.phone,
          session
        );
        if (existingUser) {
          throw new Error("User with this phone number already exists!");
        }

        // �� Transform password to passwordHash before creating user
        const userDataForModel = {
          ...userData,
          apiKey: crypto.randomBytes(16).toString("hex"),
          passwordHash: userData.password, // Transform password to passwordHash
        };
        delete userDataForModel.password; // Remove the original password field

        // create user within the transaction with transformed data
        const user = await UserRepository.createUser(userDataForModel, session);
        return user;
      }
    );

    return user;
  } catch (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
};

export default createUserManager;
