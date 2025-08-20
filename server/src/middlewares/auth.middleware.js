import jwt from "jsonwebtoken";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "change-me-access";

export function requireAuth(req, res, next) {
  try {
    const cookieHeader = req.headers["cookie"] || "";
    const accessToken = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("accessToken="))
      ?.split("=")[1];

    const authHeader = req.headers["authorization"] || "";
    const bearerToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : undefined;

    const token = accessToken || bearerToken;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    if (decoded.tokenType !== "access") {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.user = {
      id: decoded.sub,
      plan: decoded.plan,
      phone: decoded.phone,
      deviceId: decoded.deviceId,
      ipAddress: decoded.ipAddress,
      refreshTokenId: decoded.rjti,
    };
    return next();
  } catch (_e) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export default requireAuth;
