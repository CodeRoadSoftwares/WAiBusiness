import RefreshToken from "../../refreshTokens.model.js";

export const createRefreshToken = async (refreshTokenData, session = null) => {
  try {
    if (session) {
      try {
        const refreshToken = await RefreshToken.create([refreshTokenData], {
          session,
        });
        if (refreshToken && refreshToken.length > 0) {
          return refreshToken[0];
        } else {
          throw new Error("Failed to create refresh token");
        }
      } catch (error) {
        throw new Error("Failed to create refresh token");
      }
    } else {
      const refreshToken = await RefreshToken.create(refreshTokenData);
      return refreshToken;
    }
  } catch (error) {
    throw new Error(`Failed to create refresh token: ${error.message}`);
  }
};
