import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_TTL_MS = parseInt(
  process.env.REFRESH_TOKEN_TTL_MS || `${1000 * 60 * 60 * 24 * 30}`
);

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "change-me-access";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "change-me-refresh";

export function generateTokenId() {
  return crypto.randomUUID();
}

export function signAccessToken(user, context = {}) {
  const { deviceId, ipAddress, refreshTokenId } = context;
  const payload = {
    sub: user._id.toString(),
    phone: user.phone,
    plan: user.plan,
    name:
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.lastName || undefined,
    tokenType: "access",
    deviceId: deviceId || undefined,
    ipAddress: ipAddress || undefined,
    rjti: refreshTokenId || undefined,
  };
  const token = jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
  return token;
}

export function signRefreshToken({ userId, tokenId }) {
  const payload = {
    sub: userId.toString(),
    jti: tokenId,
    tokenType: "refresh",
  };
  const token = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: Math.floor(REFRESH_TOKEN_TTL_MS / 1000),
  });
  return token;
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

// DB persistence is handled via repository layer to keep concerns separate

export function buildAuthCookies({
  accessToken,
  refreshToken,
  refreshExpiresAt,
  deviceId,
}) {
  const isProd = process.env.NODE_ENV === "production";
  const forceSecure =
    String(process.env.COOKIE_SECURE || "").toLowerCase() === "true";
  const secureEnabled = forceSecure || isProd;
  const sameSite =
    process.env.COOKIE_SAMESITE || (secureEnabled ? "None" : "Lax");

  const partsBase = ["Path=/", "HttpOnly", `SameSite=${sameSite}`];
  if (secureEnabled) partsBase.push("Secure");

  const cookies = [];
  const accessCookie = [
    `accessToken=${accessToken}`,
    ...partsBase,
    `Max-Age=${15 * 60}`,
  ].join("; ");
  cookies.push(accessCookie);

  const refreshCookie = [
    `refreshToken=${refreshToken}`,
    ...partsBase,
    `Expires=${refreshExpiresAt.toUTCString()}`,
  ].join("; ");
  cookies.push(refreshCookie);

  if (deviceId) {
    const deviceParts = [
      `deviceId=${deviceId}`,
      "Path=/",
      `SameSite=${sameSite}`,
    ];
    if (secureEnabled) deviceParts.push("Secure");
    deviceParts.push(`Max-Age=${60 * 60 * 24 * 365}`);
    cookies.push(deviceParts.join("; "));
  }

  return cookies;
}
