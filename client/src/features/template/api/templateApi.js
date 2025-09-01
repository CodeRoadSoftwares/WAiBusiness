import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "../../../shared/services/baseQuery";

export const templateApi = createApi({
  reducerPath: "templateApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Template", "TemplateCount"],
  endpoints: (builder) => ({
    createTemplate: builder.mutation({
      query: (templateData) => ({
        url: "/template/create",
        method: "POST",
        body: templateData,
      }),
      invalidatesTags: ["Template", "TemplateCount"],
    }),
    getTemplates: builder.query({
      query: (params = {}) => ({
        url: "/template",
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
    getTemplatesCount: builder.query({
      query: () => ({
        url: "/template/count",
        method: "GET",
      }),
      providesTags: ["TemplateCount"],
      transformResponse: (response) => {
        return response.data;
      },
    }),
  }),
});

export const {
  useCreateTemplateMutation,
  useGetTemplatesQuery,
  useGetTemplatesCountQuery,
} = templateApi;
