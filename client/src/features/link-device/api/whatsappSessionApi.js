import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../../shared/services/baseQuery";

export const whatsappSessionApi = createApi({
  reducerPath: "whatsappSessionApi",
  baseQuery,
  endpoints: (builder) => ({
    getWhatsappSessionStatus: builder.query({
      query: () => "/whatsapp/status",
      providesTags: ["WhatsappSession"],
    }),
  }),
});

export const { useGetWhatsappSessionStatusQuery } = whatsappSessionApi;
