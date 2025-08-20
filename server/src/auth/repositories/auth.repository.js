import { createRefreshToken } from "./mutations/createRefreshToken.mutation.js";
import RefreshToken from "../refreshTokens.model.js";

export const AuthRepository = {
  createRefreshToken,
  async deactivateRefreshToken(tokenId) {
    await RefreshToken.updateOne({ tokenId }, { $set: { isActive: false } });
  },
  async findActiveRefreshToken(tokenId) {
    return RefreshToken.findOne({ tokenId, isActive: true });
  },
};
