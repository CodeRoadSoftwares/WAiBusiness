// src/services/api/baseQuery.js
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Create a base query instance
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState, endpoint }) => {
    // Don't modify headers for FormData (file uploads)
    // The browser will automatically set the correct Content-Type for FormData

    // If you need to add auth headers, you can do it here
    // But for cookie-based auth, credentials: "include" should be sufficient

    return headers;
  },
});

// Custom base query that handles token refresh detection
const customBaseQuery = async (args, api, extraOptions) => {
  try {
    console.log("🚀 Making API request:", args.url);
    console.log("🚀 Request body type:", typeof args.body);
    console.log("🚀 Is FormData:", args.body instanceof FormData);

    // First, make the original request
    const result = await baseQuery(args, api, extraOptions);

    // Check if tokens were refreshed during this request
    const tokensRefreshed =
      result.meta?.response?.headers?.get("X-Tokens-Refreshed");

    if (tokensRefreshed === "true") {
      console.log("🔄 Tokens were refreshed for request:", args.url);
      console.log("🔄 Updating auth status...");

      // Invalidate and refetch auth status to update the frontend state
      // This will trigger a re-fetch of the current user's authentication status
      api.dispatch(api.util.invalidateTags(["Auth"]));
    } else {
      console.log("✅ No token refresh detected for request:", args.url);
    }

    return result;
  } catch (error) {
    console.error("❌ Custom base query error for request:", args.url, error);
    // Re-throw the error so RTK Query can handle it
    throw error;
  }
};

// Helper functions to keep the code clean
function clearAuthData() {
  document.cookie =
    "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie =
    "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  localStorage.removeItem("apiKey");
}

function redirectToLogin() {
  // Only redirect if we're in a browser environment and not already on login page
  if (
    typeof window !== "undefined" &&
    !window.location.pathname.includes("/login")
  ) {
    window.location.href = "/login";
  }
}

export { baseQuery, customBaseQuery, clearAuthData, redirectToLogin };
