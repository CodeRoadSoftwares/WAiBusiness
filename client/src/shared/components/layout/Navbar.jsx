import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="h-14 shadow-waHeader bg-wa-bg-panelHeader-light dark:bg-wa-bg-panelHeader-dark sticky top-0 z-30">
      <div className="h-full px-3 md:px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-1 text-base md:text-lg font-semibold"
          >
            <img
              src="/brand-logo.png"
              alt="WAiBusiness"
              className="w-10 h-10 mr-2"
            />
            WAiBusiness
          </Link>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-wa-brand/10 text-wa-brand">
            beta
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-wa-bg-panel-light dark:bg-wa-bg-panel-dark border border-wa-border-light dark:border-wa-border-dark hover:border-wa-icon-dark/30">
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 text-wa-icon-light dark:text-wa-icon-dark"
              fill="currentColor"
            >
              <path d="M15.5 14h-.79l-.28-.27a6.471 6.471 0 001.48-5.34C15.21 5.01 12.2 2 8.6 2S2 5.01 2 8.39c0 3.38 3.01 6.39 6.6 6.39 1.61 0 3.09-.59 4.22-1.57l.27.28v.79l4.25 4.25c.41.41 1.07.41 1.48 0 .41-.41.41-1.07 0-1.48L15.5 14zm-6.9 0C5.02 14 2 10.98 2 7.5S5.02 1 8.6 1 15.2 4.02 15.2 7.5 12.18 14 8.6 14z" />
            </svg>
            Search
          </button>
          <button className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-wa-brand text-white hover:bg-wa-brandDark">
            U
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
