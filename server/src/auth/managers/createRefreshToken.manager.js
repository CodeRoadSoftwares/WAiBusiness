import { AuthRepository } from "../repositories/auth.repository.js";
import { TransactionManager } from "../../utils/transaction.util.js";

const DEFAULT_REFRESH_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

const createRefreshTokenManager = async (
  userId,
  tokenId,
  deviceId,
  userAgent,
  ipAddress,
  expiresAt
) => {
  try {
    const refreshTokenData = {
      userId,
      tokenId,
      deviceId,
      userAgent,
      ipAddress,
      expiresAt: expiresAt ?? new Date(Date.now() + DEFAULT_REFRESH_TTL_MS),
    };
    const refreshToken = await TransactionManager.executeTransaction(
      async (session) => {
        const refreshToken = await AuthRepository.createRefreshToken(
          refreshTokenData,
          session
        );
        return refreshToken;
      }
    );

    return refreshToken;
  } catch (error) {
    throw new Error(`Failed to create refresh token: ${error.message}`);
  }
};

export default createRefreshTokenManager;
