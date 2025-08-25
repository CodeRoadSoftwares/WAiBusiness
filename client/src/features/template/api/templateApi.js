import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "../../../shared/services/baseQuery";

export const templateApi = createApi({
  reducerPath: "templateApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Template"],
  endpoints: (builder) => ({
    createTemplate: builder.mutation({
      query: (templateData) => ({
        url: "/whatsapp/templates/create",
        method: "POST",
        body: templateData,
      }),
      invalidatesTags: ["Template"],
    }),
    getTemplates: builder.query({
      query: (params = {}) => ({
        url: "/whatsapp/templates",
        method: "GET",
        params: {
          search: params.search || "",
          limit: params.limit || 20,
          skip: params.skip || 0,
        },
      }),
      providesTags: ["Template"],
      transformResponse: (response) => {
        return response.data;
      },
    }),
  }),
});

export const { useCreateTemplateMutation, useGetTemplatesQuery } = templateApi;
