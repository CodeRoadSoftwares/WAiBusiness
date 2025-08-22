import React from "react";
import { TbLayoutDashboardFilled } from "react-icons/tb";
import { BiQrScan } from "react-icons/bi";
import { IoMdSettings } from "react-icons/io";
import { MdChat } from "react-icons/md";
import { MdCampaign } from "react-icons/md";
import { NavLink, useNavigate } from "react-router-dom";
import {
  useGetAuthStatusQuery,
  useLogoutMutation,
} from "../../../features/auth/api/authApi";
import { MdLogout } from "react-icons/md";

const linkBase =
  "group relative pl-4 px-3 py-2 rounded-md font-medium flex items-center gap-3 transition-colors text-lg";

const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: <TbLayoutDashboardFilled />,
  },
  {
    to: "/link-device",
    label: "Link Device",
    icon: <BiQrScan />,
  },
  {
    to: "/create-campaign",
    label: "Campaign",
    icon: <MdCampaign />,
  },
  {
    to: "/chats",
    label: "Chats",
    icon: <MdChat />,
  },

  { to: "/settings", label: "Settings", icon: <IoMdSettings /> },
];

function Sidebar() {
  const navigate = useNavigate();
  const { data } = useGetAuthStatusQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const fullName = data?.user?.name || data?.user?.fullName || "User";
  const plan = data?.user?.plan || "free";
  const initial = fullName?.trim()?.charAt(0)?.toUpperCase() || "U";

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate("/login", { replace: true });
    } catch {
      // ignore
    }
  };
  const PLAN_STYLES = {
    free: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
    standard: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
    premium:
      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    enterprise:
      "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
  };

  const PLAN_LABELS = {
    free: "FREE",
    standard: "BASIC",
    premium: "PRO",
    enterprise: "ENT",
  };

  const planBadgeClass =
    PLAN_STYLES[(plan || "free").toLowerCase()] || PLAN_STYLES.free;
  const planLabel =
    PLAN_LABELS[(plan || "free").toLowerCase()] || PLAN_LABELS.free;
  return (
    <aside className="w-72 shrink-0 hidden md:flex md:flex-col border-r border-wa-border-light dark:border-wa-border-dark bg-wa-bg-panel-light dark:bg-wa-bg-panel-dark">
      <div className="h-14 shadow-waHeader bg-wa-bg-panelHeader-light dark:bg-wa-bg-panelHeader-dark flex items-center px-3 md:px-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md bg-wa-bg-panel-light dark:bg-wa-bg-panel-dark border border-wa-border-light dark:border-wa-border-dark">
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 text-wa-icon-light dark:text-wa-icon-dark"
              fill="currentColor"
            >
              <path d="M15.5 14h-.79l-.28-.27a6.471 6.471 0 001.48-5.34C15.21 5.01 12.2 2 8.6 2S2 5.01 2 8.39c0 3.38 3.01 6.39 6.6 6.39 1.61 0 3.09-.59 4.22-1.57l.27.28v.79l4.25 4.25c.41.41 1.07.41 1.48 0 .41-.41.41-1.07 0-1.48L15.5 14zm-6.9 0C5.02 14 2 10.98 2 7.5S5.02 1 8.6 1 15.2 4.02 15.2 7.5 12.18 14 8.6 14z" />
            </svg>
            <input
              className="w-full bg-transparent outline-none text-sm"
              placeholder="Search or start new chat"
            />
          </div>
        </div>
      </div>
      <nav className="p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              [
                linkBase,
                isActive
                  ? "bg-wa-brand/25 text-black "
                  : "text-wa-text-secondary-light dark:text-wa-text-secondary-dark hover:bg-gray-100 hover:text-wa-text-primary-light dark:hover:text-wa-text-primary-dark",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={[
                    isActive
                      ? "text-black text-[26px]"
                      : "text-wa-icon-light dark:text-wa-icon-dark group-hover:text-wa-text-primary-light dark:group-hover:text-wa-text-primary-dark text-[24px]",
                  ].join(" ")}
                >
                  {icon}
                </span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-wa-border-light dark:border-wa-border-dark p-3">
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate("/profile")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navigate("/profile");
            }
          }}
          className="w-full flex items-center gap-3 text-left rounded-md px-2 py-2 cursor-pointer bg-wa-bg-panelHeader-light dark:bg-wa-bg-panelHeader-dark"
        >
          <div className="w-9 h-9 rounded-full bg-wa-brand text-white flex items-center justify-center font-semibold">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 truncate font-medium">
              <span className="truncate">{fullName}</span>
              <span
                className={[
                  "shrink-0 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide",
                  planBadgeClass,
                ].join(" ")}
                title={`Plan: ${plan}`}
              >
                {planLabel}
              </span>
            </div>
            <div className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
              {data?.user?.phone}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLogout();
            }}
            className="ml-auto inline-flex items-center justify-center w-8 h-8"
            title="Logout"
            disabled={isLoggingOut}
          >
            <MdLogout size={24} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
