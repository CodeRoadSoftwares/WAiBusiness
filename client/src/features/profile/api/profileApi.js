import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "../../../shared/services/baseQuery";

export const profileApi = createApi({
  reducerPath: "profileApi",
  baseQuery: customBaseQuery,
  endpoints: (builder) => ({
    getUserProfile: builder.query({
      query: () => ({
        url: "/users/profile",
        method: "GET",
      }),
      providesTags: ["Profile"],
    }),
  }),
});

export const { useGetUserProfileQuery } = profileApi;
