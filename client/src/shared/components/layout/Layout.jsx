import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function Layout({ children }) {
  return (
    <div className="min-h-screen font-sans bg-wa-bg-app-light text-wa-text-primary-light dark:bg-wa-bg-app-dark dark:text-wa-text-primary-dark">
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 bg-wa-bg-chat-light dark:bg-wa-bg-chat-dark overflow-y-auto">
            <div className="mx-auto max-w-full md:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Layout;
