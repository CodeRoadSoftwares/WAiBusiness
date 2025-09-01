import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "../../../shared/services/baseQuery";

export const audienceApi = createApi({
  reducerPath: "audienceApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Audience", "AudienceCount"],
  endpoints: (builder) => ({
    getAudience: builder.query({
      query: (params = {}) => ({
        url: "/audience",
        method: "GET",
        params: {
          search: params.search || "",
          limit: params.limit || 20,
          skip: params.skip || 0,
        },
      }),
      providesTags: ["Audience"],
      transformResponse: (response) => {
        return response.data;
      },
    }),
    getAudienceCount: builder.query({
      query: () => ({
        url: "/audience/count",
        method: "GET",
      }),
      providesTags: ["AudienceCount"],
      transformResponse: (response) => {
        return response.data;
      },
    }),
  }),
});

export const { useGetAudienceQuery, useGetAudienceCountQuery } = audienceApi;
