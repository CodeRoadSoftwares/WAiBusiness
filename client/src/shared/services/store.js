import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { usersApi } from "../../features/users/api/usersApi";
import { authApi } from "../../features/auth/api/authApi";
import { whatsappSessionApi } from "../../features/link-device/api/whatsappSessionApi";
import { campaignApi } from "../../features/campaign/api/campaignApi";
import { audienceApi } from "../../features/audience/api/audienceApi";
import { templateApi } from "../../features/template/api/templateApi";
import { mediaApi } from "../../features/media/api/mediaApi";
import { profileApi } from "../../features/profile/api/profileApi";

export const store = configureStore({
  reducer: {
    [usersApi.reducerPath]: usersApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [whatsappSessionApi.reducerPath]: whatsappSessionApi.reducer,
    [campaignApi.reducerPath]: campaignApi.reducer,
    [audienceApi.reducerPath]: audienceApi.reducer,
    [templateApi.reducerPath]: templateApi.reducer,
    [mediaApi.reducerPath]: mediaApi.reducer,
    [profileApi.reducerPath]: profileApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      usersApi.middleware,
      authApi.middleware,
      whatsappSessionApi.middleware,
      campaignApi.middleware,
      audienceApi.middleware,
      templateApi.middleware,
      mediaApi.middleware,
      profileApi.middleware
    ),
});

setupListeners(store.dispatch);

export default store;
