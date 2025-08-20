import { AuthRepository } from "../repositories/auth.repository.js";
import { findUserById } from "../../users/repositories/queries/findUserById.query.js";
import createRefreshTokenManager from "./createRefreshToken.manager.js";
import {
  buildAuthCookies,
  generateTokenId,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../services/token.services.js";

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

export default async function getAuthStatusManager({
  cookieHeader,
  userAgent,
  ipAddress,
}) {
  const cookies = parseCookies(cookieHeader);
  const accessToken = cookies.get("accessToken");
  const refreshToken = cookies.get("refreshToken");
  const deviceId = cookies.get("deviceId");

  // 1) If access token valid, user is authenticated
  if (accessToken) {
    try {
      const decoded = verifyAccessToken(accessToken);
      if (decoded?.tokenType === "access") {
        return {
          authenticated: true,
          user: {
            id: decoded.sub,
            plan: decoded.plan,
            phone: decoded.phone,
            name: decoded.name,
          },
          setCookies: null,
        };
      }
    } catch (_e) {
      // fall through to refresh
    }
  }

  // 2) Access missing/expired → try refresh
  if (!refreshToken) {
    return { authenticated: false, user: null, setCookies: null };
  }

  try {
    const decodedRefresh = verifyRefreshToken(refreshToken);
    if (decodedRefresh?.tokenType !== "refresh") {
      return { authenticated: false, user: null, setCookies: null };
    }

    const tokenId = decodedRefresh.jti;
    const userId = decodedRefresh.sub;

    const stored = await AuthRepository.findActiveRefreshToken(tokenId);
    if (!stored || stored.userId.toString() !== userId) {
      return { authenticated: false, user: null, setCookies: null };
    }

    // Rotate refresh token and issue new access token
    await AuthRepository.deactivateRefreshToken(tokenId);
    const newTokenId = generateTokenId();
    const newRefreshToken = signRefreshToken({ userId, tokenId: newTokenId });

    const effectiveDeviceId = deviceId || stored.deviceId || generateTokenId();
    const ua = userAgent || stored.userAgent || "";
    const ip = ipAddress || stored.ipAddress || "";

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

    return {
      authenticated: true,
      user: {
        id: userId,
        name:
          (fullUser?.firstName && fullUser?.lastName
            ? `${fullUser.firstName} ${fullUser.lastName}`
            : fullUser?.firstName || fullUser?.lastName) || undefined,
        phone: fullUser?.phone,
        plan: fullUser?.plan,
      },
      setCookies,
    };
  } catch (_e) {
    return { authenticated: false, user: null, setCookies: null };
  }
}
