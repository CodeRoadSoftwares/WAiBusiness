import { createUser } from "./mutations/createUser.mutation.js";
import { findUserByPhone } from "./queries/findUserByPhone.query.js";

export const UserRepository = {
  createUser,
  findUserByPhone,
};
