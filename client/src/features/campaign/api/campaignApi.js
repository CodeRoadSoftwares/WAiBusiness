import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "../../../shared/services/baseQuery";

export const campaignApi = createApi({
  reducerPath: "campaignApi",
  baseQuery: customBaseQuery,
  endpoints: (builder) => ({
    createCampaign: builder.mutation({
      query: (campaignData) => ({
        url: "/whatsapp/campaigns/create",
        method: "POST",
        body: campaignData,
      }),
    }),
  }),
});

export const { useCreateCampaignMutation } = campaignApi;
