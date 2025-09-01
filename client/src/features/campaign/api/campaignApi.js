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

export const { useCreateCampaignMutation, useGetCampaignsCountQuery } =
  campaignApi;
