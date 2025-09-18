import { campaignQueue } from "../../../queue/queues/campaign.queue.js";
import { CampaignManager } from "../managers/campaign.manager.js";
import { DateTime } from "luxon";

export const launchCampaign = async (campaignId) => {
  const campaign = await CampaignManager.getCampaignByIdManager(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  if (campaign.scheduleType === "immediate") {
    campaign.status = "running";
    await campaign.save();

    // Use batch processing for immediate campaigns too
    await campaignQueue.add(
      "start-campaign",
      { campaignId },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
        delay: 0, // Start immediately
      }
    );
  } else if (campaign.scheduleType === "scheduled") {
    campaign.status = "scheduled";

    // Parse the time string as if it's in the user's selected timezone
    // User enters "9:00 AM" and selects "America/New_York"
    // This means: "Run at 9:00 AM when it's 9:00 AM in New York timezone"
    const scheduled = DateTime.fromFormat(
      campaign.scheduledDate,
      "yyyy-MM-dd HH:mm:ss",
      { zone: campaign.timeZone }
    ).toUTC();
    const now = DateTime.utc();

    const delay = scheduled.toMillis() - now.toMillis();

    console.log("campaign.scheduledDate (string):", campaign.scheduledDate);
    console.log("campaign.timeZone:", campaign.timeZone);
    console.log("parsed scheduled (UTC):", scheduled.toISO());
    console.log("delay:", delay);
    console.log("delay in minutes:", delay / (1000 * 60));
    await campaign.save();

    await campaignQueue.add(
      "start-campaign",
      { campaignId },
      {
        attempts: 3, // retries
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 1000,
        delay: delay,
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
