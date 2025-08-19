import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./features/users/register/register";
import { StoreProvider } from "./app/providers/StoreProvider";

function App() {
  return (
    <StoreProvider>
      <Router>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </Router>
    </StoreProvider>
  );
}

export default App;
