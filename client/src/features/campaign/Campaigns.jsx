import React from "react";
import CampaignsHeader from "./components/CampaignsHeader";
import CampaignsOverview from "./components/CampaignsOverview";
import { useGetCampaignsCountQuery } from "./api/campaignApi";
import CampaignCard from "./components/CampaignCard";
import Div from "@/shared/components/Div";

function Campaigns() {
  const {
    data: campaignsCount,
    isLoading: isLoadingCampaignsCount,
    error: campaignsCountError,
  } = useGetCampaignsCountQuery();

  console.log("campaignsCount", campaignsCount);

  // Mock campaign data for testing the card
  const mockCampaigns = [
    {
      _id: "68b17972969813c9b3c6e10e",
      userId: "64b17972969813c9b3c6e10e",
      name: "Test Campaign",
      description:
        "This is a test campaign to demonstrate the beautiful campaign card design with all the features and metrics.",
      campaignType: "marketing",
      strategy: {
        mode: "ab",
        allocation: "uniform",
        weights: [
          { variantName: "A", weight: 50 },
          { variantName: "B", weight: 50 },
        ],
        sampleSizePercent: 50,
        winningCriteria: "highestDelivered",
        evaluationWindowMinutes: 60,
        autoPromoteWinner: true,
        rampUp: {
          enabled: true,
          plan: [
            { atPercentSent: 25, delayMinutes: 10 },
            { atPercentSent: 50, delayMinutes: 20 },
          ],
          delayType: "random",
          delayValue: 5,
        },
      },
      messageVariants: [
        {
          variantName: "A",
          type: "text",
          message: "Hello, this is variant A!",
          recipients: [
            {
              phone: "+1234567890",
              name: "John Doe",
              variables: { firstName: "John" },
              status: "sent",
              lastError: "",
              sentAt: "2025-08-29T09:01:00.000Z",
              deliveredAt: "2025-08-29T09:02:00.000Z",
              readAt: "2025-08-29T09:03:00.000Z",
              retries: 0,
              response: {},
              reply: {},
            },
          ],
          metrics: {
            totalRecipients: 750,
            sent: 600,
            delivered: 575,
            read: 490,
            failed: 25,
          },
          rateLimit: {
            messagesPerMinute: 20,
            maxRetries: 3,
            randomDelay: true,
          },
        },
        {
          variantName: "B",
          type: "text",
          message: "Hello, this is variant B!",
          recipients: [
            {
              phone: "+1234567891",
              name: "Jane Smith",
              variables: { firstName: "Jane" },
              status: "delivered",
              lastError: "",
              sentAt: "2025-08-29T09:01:00.000Z",
              deliveredAt: "2025-08-29T09:02:00.000Z",
              readAt: "2025-08-29T09:03:00.000Z",
              retries: 0,
              response: {},
              reply: {},
            },
          ],
          metrics: {
            totalRecipients: 750,
            sent: 600,
            delivered: 575,
            read: 490,
            failed: 25,
          },
          rateLimit: {
            messagesPerMinute: 20,
            maxRetries: 3,
            randomDelay: true,
          },
        },
      ],
      existingAudienceId: "64b17972969813c9b3c6e10f",
      scheduleType: "scheduled",
      scheduledDate: "2025-08-29T09:00:00.000Z",
      timeZone: "IST",
      customDelay: 0,
      delayUnit: "minutes",
      status: "running",
      rateLimit: {
        messagesPerMinute: 20,
        maxRetries: 3,
        randomDelay: true,
      },
      metrics: {
        totalRecipients: 1500,
        sent: 957,
        delivered: 1150,
        read: 980,
        failed: 50,
      },
      createdBy: "64b17972969813c9b3c6e10e",
      updatedBy: "64b17972969813c9b3c6e10e",
      createdAt: "2025-08-29T08:00:00.000Z",
      updatedAt: "2025-08-29T09:57:54.974Z",
      variantCount: 2,
      firstVariantType: "text",
    },
    {
      _id: "68b17972969813c9b3c6e10f",
      userId: "64b17972969813c9b3c6e10e",
      name: "Test Campaign 2",
      description:
        "This is a test campaign to demonstrate the beautiful campaign card design with all the features and metrics.",
      campaignType: "marketing",
      strategy: {
        mode: "single",
        allocation: "uniform",
        weights: [],
        sampleSizePercent: 100,
        winningCriteria: "highestRead",
        evaluationWindowMinutes: 30,
        autoPromoteWinner: false,
        rampUp: {
          enabled: false,
          plan: [],
          delayType: "random",
          delayValue: 0,
        },
      },
      messageVariants: [
        {
          variantName: "Single",
          type: "text",
          message: "Hello, this is the only variant!",
          recipients: [
            {
              phone: "+1234567892",
              name: "Alice",
              variables: { firstName: "Alice" },
              status: "read",
              lastError: "",
              sentAt: "2025-08-29T09:01:00.000Z",
              deliveredAt: "2025-08-29T09:02:00.000Z",
              readAt: "2025-08-29T09:03:00.000Z",
              retries: 0,
              response: {},
              reply: {},
            },
          ],
          metrics: {
            totalRecipients: 500,
            sent: 400,
            delivered: 350,
            read: 330,
            failed: 20,
          },
          rateLimit: {
            messagesPerMinute: 20,
            maxRetries: 3,
            randomDelay: true,
          },
        },
      ],
      existingAudienceId: "64b17972969813c9b3c6e10f",
      scheduleType: "scheduled",
      scheduledDate: "2025-08-29T09:00:00.000Z",
      timeZone: "IST",
      customDelay: 0,
      delayUnit: "minutes",
      status: "paused",
      rateLimit: {
        messagesPerMinute: 20,
        maxRetries: 3,
        randomDelay: true,
      },
      metrics: {
        totalRecipients: 500,
        sent: 400,
        delivered: 350,
        read: 330,
        failed: 20,
      },
      createdBy: "64b17972969813c9b3c6e10e",
      updatedBy: "64b17972969813c9b3c6e10e",
      createdAt: "2025-08-29T08:00:00.000Z",
      updatedAt: "2025-08-29T09:57:54.974Z",
      variantCount: 1,
      firstVariantType: "text",
    },
    {
      _id: "68b17972969813c9b3c6e110",
      userId: "64b17972969813c9b3c6e10e",
      name: "Test Campaign 3",
      description:
        "This is a test campaign to demonstrate the beautiful campaign card design with all the features and metrics.",
      campaignType: "notification",
      strategy: {
        mode: "single",
        allocation: "uniform",
        weights: [],
        sampleSizePercent: 100,
        winningCriteria: "highestRead",
        evaluationWindowMinutes: 30,
        autoPromoteWinner: false,
        rampUp: {
          enabled: false,
          plan: [],
          delayType: "random",
          delayValue: 0,
        },
      },
      messageVariants: [
        {
          variantName: "Single",
          type: "text",
          message: "Hello, this is the only variant!",
          recipients: [],
          metrics: {
            totalRecipients: 0,
            sent: 0,
            delivered: 0,
            read: 0,
            failed: 0,
          },
          rateLimit: {
            messagesPerMinute: 20,
            maxRetries: 3,
            randomDelay: true,
          },
        },
      ],
      existingAudienceId: "64b17972969813c9b3c6e10f",
      scheduleType: "immediate",
      scheduledDate: "",
      timeZone: "IST",
      customDelay: 0,
      delayUnit: "minutes",
      status: "draft",
      rateLimit: {
        messagesPerMinute: 20,
        maxRetries: 3,
        randomDelay: true,
      },
      metrics: {
        totalRecipients: 0,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
      },
      createdBy: "64b17972969813c9b3c6e10e",
      updatedBy: "64b17972969813c9b3c6e10e",
      createdAt: "2025-08-29T08:00:00.000Z",
      updatedAt: "2025-08-29T09:57:54.974Z",
      variantCount: 1,
      firstVariantType: "text",
    },
    {
      _id: "68b17972969813c9b3c6e111",
      userId: "64b17972969813c9b3c6e10e",
      name: "Test Campaign 4",
      description:
        "This is a test campaign to demonstrate the beautiful campaign card design with all the features and metrics.",
      campaignType: "reminder",
      strategy: {
        mode: "single",
        allocation: "uniform",
        weights: [],
        sampleSizePercent: 100,
        winningCriteria: "highestRead",
        evaluationWindowMinutes: 30,
        autoPromoteWinner: false,
        rampUp: {
          enabled: false,
          plan: [],
          delayType: "random",
          delayValue: 0,
        },
      },
      messageVariants: [
        {
          variantName: "Single",
          type: "text",
          message: "Hello, this is the only variant!",
          recipients: [],
          metrics: {
            totalRecipients: 1000,
            sent: 0,
            delivered: 0,
            read: 0,
            failed: 0,
          },
          rateLimit: {
            messagesPerMinute: 20,
            maxRetries: 3,
            randomDelay: true,
          },
        },
      ],
      existingAudienceId: "64b17972969813c9b3c6e10f",
      scheduleType: "delayed",
      scheduledDate: "",
      timeZone: "IST",
      customDelay: 5,
      delayUnit: "hours",
      status: "scheduled",
      rateLimit: {
        messagesPerMinute: 20,
        maxRetries: 3,
        randomDelay: true,
      },
      metrics: {
        totalRecipients: 1000,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
      },
      createdBy: "64b17972969813c9b3c6e10e",
      updatedBy: "64b17972969813c9b3c6e10e",
      createdAt: "2025-08-29T08:00:00.000Z",
      updatedAt: "2025-08-29T09:57:54.974Z",
      variantCount: 1,
      firstVariantType: "text",
    },
    {
      _id: "68b17972969813c9b3c6e112",
      userId: "64b17972969813c9b3c6e10e",
      name: "Test Campaign 5",
      description:
        "This is a test campaign to demonstrate the beautiful campaign card design with all the features and metrics.",
      campaignType: "transactional",
      strategy: {
        mode: "single",
        allocation: "uniform",
        weights: [],
        sampleSizePercent: 100,
        winningCriteria: "highestRead",
        evaluationWindowMinutes: 30,
        autoPromoteWinner: false,
        rampUp: {
          enabled: false,
          plan: [],
          delayType: "random",
          delayValue: 0,
        },
      },
      messageVariants: [
        {
          variantName: "Single",
          type: "text",
          message: "Hello, this is the only variant!",
          recipients: [],
          metrics: {
            totalRecipients: 1000,
            sent: 1000,
            delivered: 1000,
            read: 1000,
            failed: 0,
          },
          rateLimit: {
            messagesPerMinute: 20,
            maxRetries: 3,
            randomDelay: true,
          },
        },
      ],
      existingAudienceId: "64b17972969813c9b3c6e10f",
      scheduleType: "immediate",
      scheduledDate: "",
      timeZone: "IST",
      customDelay: 0,
      delayUnit: "minutes",
      status: "completed",
      rateLimit: {
        messagesPerMinute: 20,
        maxRetries: 3,
        randomDelay: true,
      },
      metrics: {
        totalRecipients: 1000,
        sent: 1000,
        delivered: 1000,
        read: 1000,
        failed: 0,
      },
      createdBy: "64b17972969813c9b3c6e10e",
      updatedBy: "64b17972969813c9b3c6e10e",
      createdAt: "2025-08-29T08:00:00.000Z",
      updatedAt: "2025-08-29T09:57:54.974Z",
      variantCount: 1,
      firstVariantType: "text",
    },
    {
      _id: "68b17972969813c9b3c6e113",
      userId: "64b17972969813c9b3c6e10e",
      name: "Test Campaign 6",
      description:
        "This is a test campaign to demonstrate the beautiful campaign card design with all the features and metrics.",
      campaignType: "other",
      strategy: {
        mode: "single",
        allocation: "uniform",
        weights: [],
        sampleSizePercent: 100,
        winningCriteria: "highestRead",
        evaluationWindowMinutes: 30,
        autoPromoteWinner: false,
        rampUp: {
          enabled: false,
          plan: [],
          delayType: "random",
          delayValue: 0,
        },
      },
      messageVariants: [
        {
          variantName: "Single",
          type: "text",
          message: "Hello, this is the only variant!",
          recipients: [],
          metrics: {
            totalRecipients: 1000,
            sent: 0,
            delivered: 0,
            read: 0,
            failed: 1000,
          },
          rateLimit: {
            messagesPerMinute: 20,
            maxRetries: 3,
            randomDelay: true,
          },
        },
      ],
      existingAudienceId: "64b17972969813c9b3c6e10f",
      scheduleType: "immediate",
      scheduledDate: "",
      timeZone: "IST",
      customDelay: 0,
      delayUnit: "minutes",
      status: "failed",
      rateLimit: {
        messagesPerMinute: 20,
        maxRetries: 3,
        randomDelay: true,
      },
      metrics: {
        totalRecipients: 1000,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 1000,
      },
      createdBy: "64b17972969813c9b3c6e10e",
      updatedBy: "64b17972969813c9b3c6e10e",
      createdAt: "2025-08-29T08:00:00.000Z",
      updatedAt: "2025-08-29T09:57:54.974Z",
      variantCount: 1,
      firstVariantType: "text",
    },
  ];

  return (
    <div className="min-h-screen max-w-7xl mx-auto space-y-6">
      <CampaignsOverview
        running={campaignsCount?.running || 0}
        paused={campaignsCount?.paused || 0}
        draft={campaignsCount?.draft || 0}
        scheduled={campaignsCount?.scheduled || 0}
        isLoading={isLoadingCampaignsCount}
        error={campaignsCountError}
      />
      <Div size="lg" className="space-y-6">
        <CampaignsHeader />
        {/* Campaign Cards Section */}
        <div className="space-y-4">
          {mockCampaigns.map((campaign) => (
            <CampaignCard campaign={campaign} key={campaign._id} />
          ))}
        </div>
      </Div>
    </div>
  );
}

export default Campaigns;
