import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "../../../shared/services/baseQuery";

export const mediaApi = createApi({
  reducerPath: "mediaApi",
  baseQuery: customBaseQuery,
  endpoints: (builder) => ({
    uploadMedia: builder.mutation({
      query: (media) => ({
        url: "/media/upload",
        method: "POST",
        body: media,
      }),
      invalidatesTags: ["Media"],
    }),
    getMedia: builder.query({
      query: (query) => ({
        url: "/media",
        method: "GET",
        params: query,
      }),
    }),
    providesTags: ["Media"],
  }),
});

export const {
  useUploadMediaMutation,
  useGetMediaQuery,
  useLazyGetMediaQuery,
} = mediaApi;
