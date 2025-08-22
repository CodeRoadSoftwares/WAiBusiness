import { AuthRepository } from "../auth/repositories/auth.repository.js";
import { findUserById } from "../users/repositories/queries/findUserById.query.js";
import createRefreshTokenManager from "../auth/managers/createRefreshToken.manager.js";
import {
  buildAuthCookies,
  generateTokenId,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../auth/services/token.services.js";

function parseCookies(cookieHeader = "") {
  const map = new Map();
  cookieHeader
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean)
    .forEach((c) => {
      const [k, ...rest] = c.split("=");
      if (!k) return;
      map.set(k, rest.join("="));
    });
  return map;
}

export async function requireAuth(req, res, next) {
  const cookieHeader = req.headers["cookie"] || "";
  const cookies = parseCookies(cookieHeader);
  const accessToken = cookies.get("accessToken");
  const refreshToken = cookies.get("refreshToken");
  const deviceId = cookies.get("deviceId");

  // 1) If access token valid, user is authenticated
  if (accessToken) {
    try {
      const decoded = verifyAccessToken(accessToken);
      if (decoded?.tokenType === "access") {
        req.user = {
          id: decoded.sub,
          plan: decoded.plan,
          phone: decoded.phone,
          deviceId: decoded.deviceId,
          ipAddress: decoded.ipAddress,
          refreshTokenId: decoded.rjti,
        };
        return next();
      }
    } catch (_e) {
      // fall through to refresh
    }
  }

  // 2) Access missing/expired → try refresh
  if (!refreshToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decodedRefresh = verifyRefreshToken(refreshToken);
    if (decodedRefresh?.tokenType !== "refresh") {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const tokenId = decodedRefresh.jti;
    const userId = decodedRefresh.sub;

    const stored = await AuthRepository.findActiveRefreshToken(tokenId);
    if (!stored || stored.userId.toString() !== userId) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Rotate refresh token and issue new access token
    await AuthRepository.deactivateRefreshToken(tokenId);
    const newTokenId = generateTokenId();
    const newRefreshToken = signRefreshToken({ userId, tokenId: newTokenId });

    const effectiveDeviceId = deviceId || stored.deviceId || generateTokenId();
    const ua = req.headers["user-agent"] || stored.userAgent || "";
    const ip = req.ip || req.connection.remoteAddress || stored.ipAddress || "";

    const newRefreshDoc = await createRefreshTokenManager(
      userId,
      newTokenId,
      effectiveDeviceId,
      ua,
      ip
    );

    const fullUser = await findUserById(userId);
    const userForAccess = fullUser || { _id: { toString: () => userId } };
    const newAccessToken = signAccessToken(userForAccess, {
      deviceId: effectiveDeviceId,
      ipAddress: ip,
      refreshTokenId: newTokenId,
    });

    const setCookies = buildAuthCookies({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      refreshExpiresAt: newRefreshDoc.expiresAt,
      deviceId: effectiveDeviceId,
    });

    // Set new cookies in response
    res.setHeader("Set-Cookie", setCookies);

    // Add custom header to indicate tokens were refreshed
    res.setHeader("X-Tokens-Refreshed", "true");

    req.user = {
      id: userId,
      plan: fullUser?.plan,
      phone: fullUser?.phone,
      deviceId: effectiveDeviceId,
      ipAddress: ip,
      refreshTokenId: newTokenId,
    };

    return next();
  } catch (_e) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
}

export default requireAuth;
