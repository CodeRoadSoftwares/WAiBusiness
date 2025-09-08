import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "../../../shared/services/baseQuery";

export const campaignApi = createApi({
  reducerPath: "campaignApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Campaign", "CampaignsCount"],
  endpoints: (builder) => ({
    createCampaign: builder.mutation({
      query: (campaignData) => ({
        url: "/whatsapp/campaigns/create",
        method: "POST",
        body: campaignData,
      }),
      invalidatesTags: ["Campaign"],
    }),
    getCampaigns: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        // Add default values for running campaigns
        searchParams.append("status", "running");
        searchParams.append("page", params.page || 1);
        searchParams.append("limit", params.limit || 10);

        // Add optional filters
        if (params.search) searchParams.append("search", params.search);
        if (params.campaignType)
          searchParams.append("campaignType", params.campaignType);
        if (params.strategyMode)
          searchParams.append("strategyMode", params.strategyMode);
        if (params.scheduleType)
          searchParams.append("scheduleType", params.scheduleType);
        if (params.startDate)
          searchParams.append("startDate", params.startDate);
        if (params.endDate) searchParams.append("endDate", params.endDate);
        if (params.minRecipients)
          searchParams.append("minRecipients", params.minRecipients);
        if (params.maxRecipients)
          searchParams.append("maxRecipients", params.maxRecipients);
        if (params.minMetrics)
          searchParams.append("minMetrics", JSON.stringify(params.minMetrics));
        if (params.maxMetrics)
          searchParams.append("maxMetrics", JSON.stringify(params.maxMetrics));
        if (params.sortBy) searchParams.append("sortBy", params.sortBy);
        if (params.sortOrder)
          searchParams.append("sortOrder", params.sortOrder);

        const url = `/whatsapp/campaigns?${searchParams.toString()}`;
        // console.log("getCampaigns API call:", { params, url });

        return {
          url,
          method: "GET",
        };
      },
      transformResponse: (response) => {
        // console.log("getCampaigns API response:", response);
        return response.data;
      },
      providesTags: ["Campaign"],
    }),
    getCampaignsCount: builder.query({
      query: () => ({
        url: "/whatsapp/campaigns/count",
        method: "GET",
      }),

      transformResponse: (response) => response.data,
      providesTags: ["CampaignsCount"],
    }),
  }),
});

export const {
  useCreateCampaignMutation,
  useGetCampaignsQuery,
  useGetCampaignsCountQuery,
} = campaignApi;
