import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "../../../shared/services/baseQuery";

export const audienceApi = createApi({
  reducerPath: "audienceApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Audience"],
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
  }),
});

export const { useGetAudienceQuery } = audienceApi;
