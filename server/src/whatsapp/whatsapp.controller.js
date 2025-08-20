import WhatsappSession from "./sessions/whatsappsessions.model.js";

export async function createWhatsappSession(userId, initialStatus = "pairing") {
  const session = new WhatsappSession({
    userId,
    status: initialStatus,
    isActive: true,
  });
  return await session.save();
}

export async function updateWhatsappSession(userId, updates) {
  return await WhatsappSession.findOneAndUpdate(
    { userId },
    { ...updates, updatedAt: new Date() },
    { new: true }
  );
}

export async function getWhatsappSession(userId) {
  return await WhatsappSession.findOne({ userId });
}

export async function deactivateWhatsappSession(userId) {
  return await WhatsappSession.findOneAndUpdate(
    { userId },
    { isActive: false, status: "disconnected" },
    { new: true }
  );
}

export default {
  createWhatsappSession,
  updateWhatsappSession,
  getWhatsappSession,
  deactivateWhatsappSession,
};
