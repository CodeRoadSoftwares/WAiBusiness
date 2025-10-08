import { presenceManager } from "../services/whatsappPresenceManager.service.js";

/**
 * Debug controller for presence management
 */
export const getPresenceStates = async (req, res) => {
  try {
    const states = presenceManager.getAllStates();

    res.json({
      success: true,
      data: {
        activeUsers: Object.keys(states).length,
        states: states,
        onlineDuration: presenceManager.onlineDuration,
        cleanupInterval: presenceManager.cleanupInterval,
      },
    });
  } catch (error) {
    console.error("Failed to get presence states:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Force user offline (for testing)
 */
export const forceUserOffline = async (req, res) => {
  try {
    const { userId } = req.params;

    await presenceManager.forceOffline(userId);

    res.json({
      success: true,
      message: `User ${userId} forced offline`,
    });
  } catch (error) {
    console.error("Failed to force user offline:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
