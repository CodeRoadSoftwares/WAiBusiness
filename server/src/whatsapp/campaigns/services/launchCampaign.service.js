import { campaignQueue } from "../../../queue/queues/campaign.queue.js";
import { CampaignManager } from "../managers/campaign.manager.js";

export const launchCampaign = async (campaignId) => {
  const campaign = await CampaignManager.getCampaignByIdManager(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  if (campaign.scheduleType === "immediate") {
    campaign.status = "running";
    await campaign.save();

    for (let variant of campaign.messageVariants) {
      for (let recipient of variant.recipients) {
        await campaignQueue.add(
          "send-message",
          {
            campaignId,
            userId: campaign.userId.toString(),
            variantName: variant.variantName,
            recipient,
            message: {
              type: variant.type,
              text: variant.message,
              media: variant.media,
              templateId: variant.templateId,
            },
          },
          {
            attempts: 3,
            backoff: { type: "fixed", delay: 5000 }, // retry after 5s
            removeOnComplete: true,
            removeOnFail: false,
          }
        );
      }
    }
  } else if (campaign.scheduleType === "scheduled") {
    campaign.status = "scheduled";
    await campaign.save();

    await campaignQueue.add(
      "start-campaign",
      { campaignId },
      {
        attempts: 3, // retries
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 1000,
        delay: campaign.scheduledDate - new Date(),
      }
    );
  } else if (campaign.scheduleType === "delayed") {
    campaign.status = "scheduled"; // Use "scheduled" status for delayed campaigns too
    await campaign.save();

    const delayMs = convertDelay(campaign.customDelay, campaign.delayUnit);
    await campaignQueue.add(
      "start-campaign",
      { campaignId },
      {
        attempts: 3, // retries
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 1000,
        delay: delayMs,
      }
    );
  }

  return campaign;
};

const convertDelay = (value, unit) => {
  const multipliers = { minutes: 60_000, hours: 3_600_000, days: 86_400_000 };
  return value * multipliers[unit];
};
