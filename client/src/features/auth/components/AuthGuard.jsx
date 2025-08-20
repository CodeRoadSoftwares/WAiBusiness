import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useGetAuthStatusQuery } from "../../auth/api/authApi";

// mode: "private" protects routes for authenticated users only
// mode: "public" redirects authenticated users away from public-only routes
function AuthGuard({ mode = "private", children }) {
  const location = useLocation();
  const { data, isLoading, isError } = useGetAuthStatusQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  if (isLoading) return <div />;

  const isAuthed = data?.authenticated === true && !isError;

  if (mode === "private") {
    if (!isAuthed) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
  }

  // public-only
  if (isAuthed) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default AuthGuard;
