import React from "react";
import { TbLayoutDashboardFilled } from "react-icons/tb";
import { BiQrScan } from "react-icons/bi";
import { IoMdSettings } from "react-icons/io";
import { MdChat } from "react-icons/md";
import { MdCampaign } from "react-icons/md";
import { NavLink, useNavigate, Link } from "react-router-dom";
import {
  useGetAuthStatusQuery,
  useLogoutMutation,
} from "../../../features/auth/api/authApi";
import { MdLogout } from "react-icons/md";
import { FaFileAlt, FaRegImage, FaUserFriends } from "react-icons/fa";
import { FaUserGroup } from "react-icons/fa6";
import { HiUsers } from "react-icons/hi";

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
    to: "/campaign",
    label: "Campaign",
    icon: <MdCampaign />,
  },
  {
    to: "/campaign/audiences",
    label: "Audiences",
    icon: <FaUserFriends size={24} />,
  },
  {
    to: "/campaign/templates",
    label: "Templates",
    icon: <FaFileAlt size={24}/>,
  },
  {
    to: "/chats",
    label: "Chats",
    icon: <MdChat />,
  },
  {
    to: "/media",
    label: "Media",
    icon: <FaRegImage />,
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
    <aside className="w-72 shrink-0 hidden md:flex md:flex-col bg-white">
      <div className="h-14 bg-white flex items-center px-3 md:px-4">
        <Link
          to="/dashboard"
          className="flex items-center justify-center gap-1 text-base md:text-xl font-semibold text-wa-brand"
        >
          <img
            src="/brand-logo-filled.png"
            alt="WAiBusiness"
            className="w-8 h-8 mr-1"
          />
          WaiBusiness
        </Link>
        <span className="text-sm px-1.5 py-0.5 rounded bg-wa-brand/10 text-wa-brand font-semibold ml-2">
          Beta
        </span>
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
