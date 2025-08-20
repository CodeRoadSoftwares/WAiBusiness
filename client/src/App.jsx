import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { StoreProvider } from "./app/providers/StoreProvider";
import Login from "./features/auth/login/login";
import Register from "./features/users/register/register";
import Dashboard from "./features/dashboard/dashboard";
import AuthGuard from "./features/auth/components/AuthGuard";
import Main from "./shared/components/layout/Main";
import NotFound from "./NotFound";
import LinkDevice from "./features/link-device/LinkDevice";

function App() {
  return (
    <StoreProvider>
      <Router>
        <Routes>
          <Route
            path="/register"
            element={
              <AuthGuard mode="public">
                <Main withLayout={false}>
                  <Register />
                </Main>
              </AuthGuard>
            }
          />
          <Route
            path="/login"
            element={
              <AuthGuard mode="public">
                <Main withLayout={false}>
                  <Login />
                </Main>
              </AuthGuard>
            }
          />
          <Route
            path="/dashboard"
            element={
              <AuthGuard mode="private">
                <Main>
                  <Dashboard />
                </Main>
              </AuthGuard>
            }
          />
          <Route
            path="/link-device"
            element={
              <AuthGuard mode="private">
                <Main>
                  <LinkDevice />
                </Main>
              </AuthGuard>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </StoreProvider>
  );
}

export default App;
