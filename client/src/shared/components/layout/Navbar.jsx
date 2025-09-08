import React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { HiHome, HiChevronRight } from "react-icons/hi";
import { ChevronRight, House, ArrowLeft, ArrowRight } from "lucide-react";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Custom route labels mapping
  const routeLabels = {
    campaign: "Campaigns",
    "link-device": "Link Device",
    chats: "Conversations",
    settings: "Settings",
    create: "Create",
    edit: "Edit",
    profile: "Profile",
    campaigns: "All",
  };

  // Function to generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split("/").filter((x) => x);
    const breadcrumbs = [];

    let currentPath = "";

    pathnames.forEach((name, index) => {
      currentPath += `/${name}`;

      // Skip dashboard route since it's already shown as home
      if (name === "dashboard") return;

      // Use custom label if available, otherwise format the route name
      const label =
        routeLabels[name] ||
        name
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

      breadcrumbs.push({
        name: label,
        path: currentPath,
        isLast: index === pathnames.length - 1,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="h-14 bg-white sticky top-0 z-30 border-b border-gray-100">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left controls: nav buttons + breadcrumbs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate(1)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
            title="Go forward"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <nav className="flex items-center space-x-1 ml-2">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 group"
            >
              <House className="w-4 h-4 group-hover:text-wa-brand" />
              <span className="font-medium">Dashboard</span>
            </Link>

            {breadcrumbs.map((breadcrumb) => (
              <div key={breadcrumb.path} className="flex items-center">
                <ChevronRight className="w-5 h-5 text-gray-400 mx-1" />
                {breadcrumb.isLast ? (
                  <span className="px-3 py-1.5 rounded-lg bg-wa-brand/10 text-wa-brand font-medium cursor-default">
                    {breadcrumb.name}
                  </span>
                ) : (
                  <Link
                    to={breadcrumb.path}
                    className="px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 font-medium"
                  >
                    {breadcrumb.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
