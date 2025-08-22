import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "../../../shared/services/baseQuery";

export const whatsappSessionApi = createApi({
  reducerPath: "whatsappSessionApi",
  baseQuery: customBaseQuery,
  endpoints: (builder) => ({
    getWhatsappSessionStatus: builder.query({
      query: () => "/whatsapp/status",
      providesTags: ["WhatsappSession"],
    }),
  }),
});

export const { useGetWhatsappSessionStatusQuery } = whatsappSessionApi;
