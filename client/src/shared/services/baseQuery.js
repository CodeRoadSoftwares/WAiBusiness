// src/services/api/baseQuery.js
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Create a base query instance
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    return headers;
  },
});

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

export { baseQuery, clearAuthData, redirectToLogin };
