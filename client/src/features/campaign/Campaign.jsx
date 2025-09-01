import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Div from "../../shared/components/Div";
import {
  FaUsers,
  FaFileAlt,
  FaBullhorn,
  FaArrowRight,
  FaChartLine,
  FaHistory,
  FaCog,
} from "react-icons/fa";
import { useGetAudienceCountQuery } from "../audience/api/audienceApi";
import { useGetTemplatesCountQuery } from "../template/api/templateApi";
import {
  CalendarCheck2,
  ClipboardClock,
  Image,
  Layers,
  MessageSquareText,
  Users,
} from "lucide-react";
import { useGetCampaignsCountQuery } from "./api/campaignApi";

function Campaign() {
  const navigate = useNavigate();

  const {
    data: audienceCount,
    isLoading: isLoadingAudienceCount,
    error: audienceCountError,
  } = useGetAudienceCountQuery();

  const {
    data: templatesCount,
    isLoading: isLoadingTemplatesCount,
    error: templatesCountError,
  } = useGetTemplatesCountQuery();

  const {
    data: campaignsCount,
    isLoading: isLoadingCampaignsCount,
    error: campaignsCountError,
  } = useGetCampaignsCountQuery();

  // Loading skeleton component for stats
  const StatSkeleton = () => (
    <Div
      size="lg"
      className="bg-wa-bg-panel-light dark:bg-wa-bg-panel-dark animate-pulse"
    >
      <div className="flex items-center gap-4">
        <div className="bg-gray-300 dark:bg-gray-600 rounded-full p-3 w-12 h-12"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-2"></div>
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16 mb-1"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
        </div>
      </div>
    </Div>
  );

  // Display Error State for stats
  const StatError = ({ message }) => (
    <Div
      size="lg"
      className="bg-wa-bg-panel-light dark:bg-wa-bg-panel-dark border border-red-200 dark:border-red-800"
    >
      <div className="flex items-center gap-4">
        <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-3">
          <FaUsers size={24} className="text-red-500" />
        </div>
        <div>
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">
            {message}
          </p>
          <p className="text-red-500 dark:text-red-400 text-xs">
            Failed to load data
          </p>
        </div>
      </div>
    </Div>
  );

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Action Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Create Audience Card */}
          <Link to="/campaign/create-audience" className="group">
            <Div
              size="xl"
              className="bg-wa-bg-panel-light dark:bg-wa-bg-panel-light  hover:shadow-waPanel transition-all duration-300 cursor-pointer h-full"
            >
              <div className="flex flex-col items-center text-center h-full">
                <div className="bg-wa-brand/10 rounded-full p-6 mb-6 group-hover:bg-wa-brand/20 transition-colors duration-300">
                  <FaUsers size={48} className="text-wa-brand" />
                </div>
                <h3 className="text-2xl font-semibold text-wa-text-primary-light dark:text-wa-text-primary-dark mb-3">
                  Create Audience
                </h3>
                <p className="text-wa-text-secondary-light dark:text-wa-text-secondary-dark mb-6 flex-grow">
                  Build targeted audiences by uploading contact lists or
                  creating segments
                </p>
                <div className="flex items-center text-wa-brand font-medium ">
                  <span>Get Started</span>
                  <FaArrowRight
                    size={16}
                    className="ml-2 group-hover:translate-x-1 transition-transform duration-300"
                  />
                </div>
              </div>
            </Div>
          </Link>

          {/* Create Template Card */}
          <Link to="/campaign/create-template" className="group">
            <Div
              size="xl"
              className="bg-wa-bg-panel-light dark:bg-wa-bg-panel-dark hover:shadow-waPanel transition-all duration-300 cursor-pointer h-full"
            >
              <div className="flex flex-col items-center text-center h-full">
                <div className="bg-wa-brand/10 rounded-full p-6 mb-6 group-hover:bg-wa-brand/20 transition-colors duration-300">
                  <FaFileAlt size={48} className="text-wa-brand" />
                </div>
                <h3 className="text-2xl font-semibold text-wa-text-primary-light dark:text-wa-text-primary-dark mb-3">
                  Create Template
                </h3>
                <p className="text-wa-text-secondary-light dark:text-wa-text-secondary-dark mb-6 flex-grow">
                  Design message templates with text, media, and interactive
                  elements
                </p>
                <div className="flex items-center text-wa-brand font-medium ">
                  <span>Get Started</span>
                  <FaArrowRight
                    size={16}
                    className="ml-2 group-hover:translate-x-1 transition-transform duration-300"
                  />
                </div>
              </div>
            </Div>
          </Link>

          {/* Create Campaign Card */}
          <Link to="/campaign/create-campaign" className="group">
            <Div
              size="xl"
              className="bg-wa-bg-panel-light dark:bg-wa-bg-panel-dark hover:shadow-waPanel transition-all duration-300 cursor-pointer h-full"
            >
              <div className="flex flex-col items-center text-center h-full">
                <div className="bg-wa-brand/10 rounded-full p-6 mb-6 group-hover:bg-wa-brand/20 transition-colors duration-300">
                  <FaBullhorn size={48} className="text-wa-brand" />
                </div>
                <h3 className="text-2xl font-semibold text-wa-text-primary-light dark:text-wa-text-primary-dark mb-3">
                  Create Campaign
                </h3>
                <p className="text-wa-text-secondary-light dark:text-wa-text-secondary-dark mb-6 flex-grow">
                  Launch campaigns with your audience and templates, schedule
                  delivery
                </p>
                <div className="flex items-center text-wa-brand font-medium ">
                  <span>Get Started</span>
                  <FaArrowRight
                    size={16}
                    className="ml-2 group-hover:translate-x-1 transition-transform duration-300"
                  />
                </div>
              </div>
            </Div>
          </Link>
        </div>

        {/* Quick Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* Total Audiences - Dynamic Data */}
          {isLoadingAudienceCount ? (
            <StatSkeleton />
          ) : audienceCountError ? (
            <StatError message="Failed to load audience data" />
          ) : (
            <Div
              size="lg"
              className="bg-wa-bg-panel-light dark:bg-wa-bg-panel-dark cursor-pointer group hover:shadow-waPanel hover:translate-y-1 transition-all duration-200"
              onClick={() => {
                navigate("/campaign/audiences");
              }}
            >
              <Link className="flex items-center gap-4">
                <div className="bg-wa-brand/10 rounded-full p-3 group-hover:bg-wa-brand/20 transition-colors duration-200">
                  <FaUsers size={24} className="text-wa-brand" />
                </div>
                <div>
                  <p className="text-wa-text-secondary-light dark:text-wa-text-secondary-dark text-sm">
                    Total Audiences
                  </p>
                  <p className="text-2xl font-bold text-wa-text-primary-light dark:text-wa-text-primary-dark ">
                    {audienceCount?.audienceCount || 0}
                  </p>
                  <span className="font-semibold text-wa-text-secondary-light dark:text-wa-text-secondary-dark flex items-center">
                    <Users className="inline w-4 h-4 mr-1" />
                    {audienceCount?.totalContacts || 0}
                  </span>
                </div>
              </Link>
            </Div>
          )}

          {/* Templates - Static Data for now */}
          {isLoadingTemplatesCount ? (
            <StatSkeleton />
          ) : templatesCountError ? (
            <StatError message="Failed to load templates data" />
          ) : (
            <Div
              size="lg"
              className="bg-wa-bg-panel-light dark:bg-wa-bg-panel-dark cursor-pointer group hover:shadow-waPanel hover:translate-y-1 transition-all duration-200"
              onClick={() => {
                navigate("/campaign/templates");
              }}
            >
              <div className="flex items-center gap-4">
                <div className="bg-wa-brand/10 rounded-full p-3 group-hover:bg-wa-brand/20 transition-colors duration-200">
                  <FaFileAlt size={24} className="text-wa-brand" />
                </div>
                <div>
                  <p className="text-wa-text-secondary-light dark:text-wa-text-secondary-dark text-sm">
                    Templates
                  </p>
                  <p className="text-2xl font-bold text-wa-text-primary-light dark:text-wa-text-primary-dark">
                    {templatesCount?.total || 0}
                  </p>
                  <div className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark flex items-center">
                    <span className="font-semibold text-wa-text-secondary-light dark:text-wa-text-secondary-dark inline-flex items-center">
                      <MessageSquareText className="inline w-4 h-4 mr-1" />
                      {templatesCount?.text || 0}
                    </span>
                    <span
                      className="text-wa-text-secondary-light dark:text-wa-text-secondary-dark text-lg align-middle mx-1"
                      aria-hidden="true"
                    >
                      &bull;
                    </span>
                    <span className="font-semibold text-wa-text-secondary-light dark:text-wa-text-secondary-dark inline-flex items-center">
                      <Image className="inline w-4 h-4 mr-1" />
                      {templatesCount?.media || 0}
                    </span>
                    <span
                      className="text-wa-text-secondary-light dark:text-wa-text-secondary-dark text-lg align-middle mx-1"
                      aria-hidden="true"
                    >
                      &bull;
                    </span>
                    <span className="font-semibold text-wa-text-secondary-light dark:text-wa-text-secondary-dark inline-flex items-center">
                      <Layers className="inline w-4 h-4 mr-1" />
                      {templatesCount?.mixed || 0}
                    </span>
                  </div>
                </div>
              </div>
            </Div>
          )}

          {/* Active Campaigns - Static Data for now */}
          {isLoadingCampaignsCount ? (
            <StatSkeleton />
          ) : campaignsCountError ? (
            <StatError message="Failed to load campaigns data" />
          ) : (
            <Div
              size="lg"
              className="bg-wa-bg-panel-light dark:bg-wa-bg-panel-dark cursor-pointer group hover:shadow-waPanel hover:translate-y-1 transition-all duration-200"
              onClick={() => {
                navigate("/campaign/campaigns");
              }}
            >
              <div className="flex items-center gap-4">
                <div className="bg-wa-brand/10 rounded-full p-3 group-hover:bg-wa-brand/20 transition-colors duration-200">
                  <FaBullhorn size={24} className="text-wa-brand" />
                </div>
                <div>
                  <p className="text-wa-text-secondary-light dark:text-wa-text-secondary-dark text-sm">
                    Campaigns Running
                  </p>
                  <p className="text-2xl font-bold text-wa-text-primary-light dark:text-wa-text-primary-dark">
                    {campaignsCount?.running || 0}
                  </p>
                  <span className="font-semibold text-wa-text-secondary-light dark:text-wa-text-secondary-dark flex items-center">
                    <ClipboardClock className="inline w-4 h-4 mr-1" />
                    {campaignsCount?.scheduled || 0}
                  </span>
                </div>
              </div>
            </Div>
          )}

          {/* Total Sent - Static Data for now */}
          <Div
            size="lg"
            className="bg-wa-bg-panel-light dark:bg-wa-bg-panel-dark cursor-pointer group hover:shadow-waPanel hover:translate-y-1 transition-all duration-200"
            onClick={() => {
              navigate("/campaign/campaigns");
            }}
          >
            <div className="flex items-center gap-4">
              <div className="bg-wa-brand/10 rounded-full p-3 group-hover:bg-wa-brand/20 transition-colors duration-200">
                <FaChartLine size={24} className="text-wa-brand" />
              </div>
              <div>
                <p className="text-wa-text-secondary-light dark:text-wa-text-secondary-dark text-sm">
                  Total Sent
                </p>
                <p className="text-2xl font-bold text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  2.4K
                </p>
                <span className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Messages
                </span>
              </div>
            </div>
          </Div>
        </div>

        {/* Recent Activity Section */}
        <Div
          size="xl"
          className="bg-wa-bg-panel-light dark:bg-wa-bg-panel-dark"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-wa-text-primary-light dark:text-wa-text-primary-dark">
              Recent Activity
            </h3>
            <button className="flex items-center gap-2 text-wa-brand hover:text-wa-brandDark transition-colors duration-200">
              <FaCog size={16} />
              <span>View All</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-wa-bg-app-light dark:bg-wa-bg-app-dark rounded-lg">
              <div className="bg-wa-brand/10 rounded-full p-2">
                <FaBullhorn size={16} className="text-wa-brand" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  "Summer Sale" campaign sent to 500 contacts
                </p>
                <p className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  2 hours ago
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Completed
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-wa-bg-app-light dark:bg-wa-bg-app-dark rounded-lg">
              <div className="bg-wa-brand/10 rounded-full p-2">
                <FaUsers size={16} className="text-wa-brand" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  New audience "Premium Customers" created
                </p>
                <p className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  1 day ago
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  New
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-wa-bg-app-light dark:bg-wa-bg-app-dark rounded-lg">
              <div className="bg-wa-brand/10 rounded-full p-2">
                <FaFileAlt size={16} className="text-wa-brand" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  Template "Welcome Message" approved
                </p>
                <p className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  3 days ago
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Approved
                </span>
              </div>
            </div>
          </div>
        </Div>
      </div>
    </div>
  );
}

export default Campaign;
