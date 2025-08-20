import { findUserByPhone } from "../users/repositories/queries/findUserByPhone.query.js";
import createRefreshTokenManager from "./managers/createRefreshToken.manager.js";
import { AuthRepository } from "./repositories/auth.repository.js";
import getAuthStatusManager from "./managers/getAuthStatus.js";
import {
  buildAuthCookies,
  generateTokenId,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./services/token.services.js";

function getIpAddress(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    return xff.split(",")[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || "";
}

const login = async (req, res) => {
  try {
    const { phone, password } = req.body || {};
    if (!phone || !password) {
      return res.status(400).json({ error: "phone and password are required" });
    }

    const user = await findUserByPhone(phone);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const userAgent = req.headers["user-agent"] || "";
    const ipAddress = getIpAddress(req);
    // try to read deviceId from cookie first, then body
    const cookieHeader = req.headers["cookie"] || "";
    const deviceIdFromCookie = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("deviceId="))
      ?.split("=")[1];
    const deviceId =
      deviceIdFromCookie || req.body?.deviceId || generateTokenId();
    const tokenId = generateTokenId();
    const refreshToken = signRefreshToken({ userId: user._id, tokenId });
    const accessToken = signAccessToken(user, {
      deviceId,
      ipAddress,
      refreshTokenId: tokenId,
    });

    const refreshDoc = await createRefreshTokenManager(
      user._id,
      tokenId,
      deviceId,
      userAgent,
      ipAddress
    );

    const cookies = buildAuthCookies({
      accessToken,
      refreshToken,
      refreshExpiresAt: refreshDoc.expiresAt,
      deviceId,
    });
    res.setHeader("Set-Cookie", cookies);

    return res.status(200).json({
      ok: true,
      user: { id: user._id, phone: user.phone, plan: user.plan },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const refresh = async (req, res) => {
  try {
    const cookieHeader = req.headers["cookie"] || "";
    const refreshToken = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("refreshToken="))
      ?.split("=")[1];

    if (!refreshToken) {
      return res.status(401).json({ error: "Missing refresh token" });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (_e) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const tokenId = decoded?.jti;
    const userId = decoded?.sub;
    if (!tokenId || !userId) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const stored = await AuthRepository.findActiveRefreshToken(tokenId);
    if (!stored || stored.userId.toString() !== userId) {
      return res
        .status(401)
        .json({ error: "Refresh token not found or inactive" });
    }

    // Rotate refresh token
    await AuthRepository.deactivateRefreshToken(tokenId);
    const newTokenId = generateTokenId();
    const newRefreshToken = signRefreshToken({ userId, tokenId: newTokenId });

    const userAgent = req.headers["user-agent"] || stored.userAgent || "";
    const ipAddress = getIpAddress(req) || stored.ipAddress || "";
    const deviceId = stored.deviceId || undefined;

    const newRefreshDoc = await createRefreshTokenManager(
      userId,
      newTokenId,
      deviceId,
      userAgent,
      ipAddress
    );

    // New access token
    const user = await findUserById(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    const accessToken = signAccessToken(user, {
      deviceId,
      ipAddress,
      refreshTokenId: newTokenId,
    });

    const cookies = buildAuthCookies({
      accessToken,
      refreshToken: newRefreshToken,
      refreshExpiresAt: newRefreshDoc.expiresAt,
      deviceId,
    });
    res.setHeader("Set-Cookie", cookies);

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const cookieHeader = req.headers["cookie"] || "";
    const refreshToken = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("refreshToken="))
      ?.split("=")[1];

    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        if (decoded?.jti) {
          await AuthRepository.deactivateRefreshToken(decoded.jti);
        }
      } catch (_e) {}
    }

    // Clear cookies
    res.setHeader("Set-Cookie", [
      "accessToken=; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=0",
      "refreshToken=; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=0",
    ]);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const AuthController = {
  login,
  refresh,
  logout,
  async status(req, res) {
    try {
      const cookieHeader = req.headers["cookie"] || "";
      const userAgent = req.headers["user-agent"] || "";
      const ipAddress = getIpAddress(req);
      const result = await getAuthStatusManager({
        cookieHeader,
        userAgent,
        ipAddress,
      });

      if (result.setCookies) {
        res.setHeader("Set-Cookie", result.setCookies);
      }

      return res.status(200).json({ ok: true, ...result });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
};

export default AuthController;
