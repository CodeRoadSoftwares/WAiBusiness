import express from "express";
import {
  sendDirectMessage,
  sendTemplateMessage,
  getMessageStatus,
  getMessageHistory,
  getMessageStats,
  getMessageStatsByType,
  sendBulkMessages,
} from "../controllers/directMessage.controller.js";
import {
  flexibleAuth,
  apiRateLimit,
} from "../../../middlewares/apiAuth.middleware.js";

const router = express.Router();

// Apply authentication and rate limiting to all routes
router.use(flexibleAuth);
router.use(apiRateLimit(100, 60000)); // 100 requests per minute

/**
 * @route POST /m
 * @desc Send a direct message (text/media/mixed)
 * @access Private (API Key or JWT)
 */
router.post("/m", sendDirectMessage);

/**
 * @route POST /m/:phone/t/:templateId
 * @desc Send a template message
 * @access Private (API Key or JWT)
 */
router.post("/m/:phone/t/:templateId", sendTemplateMessage);

/**
 * @route GET /m/:messageId/status
 * @desc Get message status
 * @access Private (API Key or JWT)
 */
router.get("/m/:messageId/status", getMessageStatus);

/**
 * @route GET /m/history
 * @desc Get message history
 * @access Private (API Key or JWT)
 * @query page, limit, status, type, phone, startDate, endDate
 */
router.get("/m/history", getMessageHistory);

/**
 * @route GET /m/stats
 * @desc Get message statistics
 * @access Private (API Key or JWT)
 * @query startDate, endDate
 */
router.get("/m/stats", getMessageStats);

/**
 * @route GET /m/stats/by-type
 * @desc Get message statistics by message type
 * @access Private (API Key or JWT)
 * @query startDate, endDate
 */
router.get("/m/stats/by-type", getMessageStatsByType);

/**
 * @route POST /m/bulk
 * @desc Send bulk messages
 * @access Private (API Key or JWT)
 */
router.post("/m/bulk", sendBulkMessages);

export default router;
