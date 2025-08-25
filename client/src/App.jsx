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
import CreateCampaign from "./features/campaign/CreateCampaign";
import Campaign from "./features/campaign/Campaign";
import CreateAudience from "./features/audience/CreateAudience";
import CreateTemplate from "./features/template/CreateTemplate";

function App() {
  return (
    <StoreProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <AuthGuard mode="private">
                <Main withLayout={false}>
                  <Dashboard />
                </Main>
              </AuthGuard>
            }
          />
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
          <Route
            path="/campaign"
            element={
              <AuthGuard mode="private">
                <Main>
                  <Campaign />
                </Main>
              </AuthGuard>
            }
          />
          <Route
            path="/campaign/create-audience"
            element={
              <AuthGuard mode="private">
                <Main>
                  <CreateAudience />
                </Main>
              </AuthGuard>
            }
          />
          <Route
            path="/campaign/create-template"
            element={
              <AuthGuard mode="private">
                <Main>
                  <CreateTemplate />
                </Main>
              </AuthGuard>
            }
          />
          <Route
            path="/campaign/create-campaign"
            element={
              <AuthGuard mode="private">
                <Main>
                  <CreateCampaign />
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
