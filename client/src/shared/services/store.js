import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { usersApi } from "../../features/users/api/usersApi";
import { authApi } from "../../features/auth/api/authApi";
import { whatsappSessionApi } from "../../features/link-device/api/whatsappSessionApi";

export const store = configureStore({
  reducer: {
    [usersApi.reducerPath]: usersApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [whatsappSessionApi.reducerPath]: whatsappSessionApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      usersApi.middleware,
      authApi.middleware,
      whatsappSessionApi.middleware
    ),
});

setupListeners(store.dispatch);

export default store;
