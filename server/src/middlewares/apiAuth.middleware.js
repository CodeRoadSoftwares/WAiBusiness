import User from "../users/user.model.js";
import jwt from "jsonwebtoken";

/**
 * API Key Authentication Middleware
 * Validates API key from headers and attaches user to request
 */
export const apiAuth = async (req, res, next) => {
  try {
    const apiKey =
      req.headers["x-api-key"] ||
      req.headers["authorization"]?.replace("Bearer ", "");

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: "API key required",
        code: "MISSING_API_KEY",
      });
    }

    // Find user by API key
    const user = await User.findOne({
      apiKey: apiKey,
      isActive: true,
    }).select("-passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid API key",
        code: "INVALID_API_KEY",
      });
    }

    // Attach user to request
    req.user = user;
    req.authType = "api_key";

    next();
  } catch (error) {
    console.error("API auth error:", error);
    return res.status(500).json({
      success: false,
      error: "Authentication failed",
      code: "AUTH_ERROR",
    });
  }
};

/**
 * JWT Token Authentication Middleware
 * Validates JWT token for web app users
 */
export const jwtAuth = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Token required",
        code: "MISSING_TOKEN",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-passwordHash");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
        code: "INVALID_TOKEN",
      });
    }

    req.user = user;
    req.authType = "jwt";

    next();
  } catch (error) {
    console.error("JWT auth error:", error);
    return res.status(401).json({
      success: false,
      error: "Invalid token",
      code: "INVALID_TOKEN",
    });
  }
};

/**
 * Flexible Authentication Middleware
 * Tries API key first, then JWT token
 */
export const flexibleAuth = async (req, res, next) => {
  try {
    const apiKey =
      req.headers["x-api-key"] ||
      req.headers["authorization"]?.replace("Bearer ", "");

    console.log("🔑 API Key received:", apiKey);
    console.log("📏 API Key length:", apiKey?.length);

    // Try API key first
    if (apiKey && apiKey.length === 32) {
      // API keys are 32 chars
      const user = await User.findOne({
        apiKey: apiKey,
        isActive: true,
      }).select("-passwordHash");

      console.log("👤 User found:", user ? user._id : "Not found");

      if (user) {
        req.user = user;
        req.authType = "api_key";
        return next();
      }
    }

    // Try JWT token
    const token = req.headers["authorization"]?.replace("Bearer ", "");
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-passwordHash");

      if (user && user.isActive) {
        req.user = user;
        req.authType = "jwt";
        return next();
      }
    }

    return res.status(401).json({
      success: false,
      error: "Authentication required",
      code: "AUTH_REQUIRED",
    });
  } catch (error) {
    console.error("Flexible auth error:", error);
    return res.status(401).json({
      success: false,
      error: "Authentication failed",
      code: "AUTH_ERROR",
    });
  }
};

/**
 * Rate limiting middleware for API endpoints
 */
export const apiRateLimit = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user?._id?.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!userId) {
      return next();
    }

    // Clean old entries
    if (requests.has(userId)) {
      const userRequests = requests
        .get(userId)
        .filter((time) => time > windowStart);
      requests.set(userId, userRequests);
    } else {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: Math.ceil((userRequests[0] + windowMs - now) / 1000),
      });
    }

    userRequests.push(now);
    next();
  };
};
