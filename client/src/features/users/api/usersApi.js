import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../../shared/services/baseQuery";

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery,
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (credentials) => ({
        url: "/users/register",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const { useRegisterMutation } = usersApi;
