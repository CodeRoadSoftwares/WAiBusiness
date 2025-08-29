import WhatsappSession from "../whatsappsessions.model.js";
import { startWhatsappSession } from "./whatsappsession.service.js";

const nullSocket = { emit: () => {} };

export async function warmUpWhatsappSessions() {
  const users = await WhatsappSession.find(
    { status: "connected", sessionCreds: { $ne: null } },
    { userId: 1 }
  ).lean();

  for (const u of users) {
    startWhatsappSession({
      userId: u.userId.toString(),
      socket: nullSocket,
    }).catch(async (err) => {
      // Device unlinked → cleanup DB
      await WhatsappSession.updateOne(
        { userId: u.userId },
        {
          $set: { status: "disconnected" },
          $unset: { sessionCreds: 1, sessionKeys: 1 },
        }
      );
    });
  }
}
