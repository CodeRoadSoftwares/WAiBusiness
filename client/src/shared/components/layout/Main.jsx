import React from "react";
import Layout from "./Layout";

// Main wraps a page with optional layout
// usage: <Main withLayout> <Page/> </Main>
function Main({ withLayout = true, children }) {
  if (!withLayout) return <>{children}</>;
  return <Layout>{children}</Layout>;
}

export default Main;
