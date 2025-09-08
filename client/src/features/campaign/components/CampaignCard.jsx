import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Play,
  Pause,
  Calendar,
  Users,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  MoreVertical,
  Save,
} from "lucide-react";
import capitalize from "@/shared/utils/capitalize";

const CampaignCard = ({ campaign }) => {
  const {
    _id,
    name,
    description,
    status,
    campaignType,
    scheduleType,
    scheduledDate,
    metrics,
    updatedAt,
    variantCount,
    firstVariantType,
  } = campaign;

  // Status configuration
  const getStatusConfig = (status) => {
    const configs = {
      running: {
        icon: Play,
        color: "text-green-600",
        accent: "bg-green-500",
        iconBg: "bg-green-100",
        border: "border-green-300",
        badge:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200",
      },
      paused: {
        icon: Pause,
        color: "text-amber-600",
        accent: "bg-amber-500",
        iconBg: "bg-amber-100",
        border: "border-amber-300",
        badge:
          "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 hover:bg-amber-200",
      },
      draft: {
        icon: Save,
        color: "text-gray-600",
        accent: "bg-gray-500",
        iconBg: "bg-gray-200",
        border: "border-gray-300",
        badge:
          "bg-gray-200 text-gray-800 dark:bg-gray-900 dark:text-gray-200 hover:bg-gray-300",
      },
      scheduled: {
        icon: Clock,
        color: "text-purple-600",
        accent: "bg-purple-500",
        iconBg: "bg-purple-100",
        border: "border-purple-300",
        badge:
          "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 hover:bg-purple-200",
      },
      completed: {
        icon: CheckCircle,
        color: "text-emerald-600",
        accent: "bg-emerald-500",
        iconBg: "bg-emerald-100",
        border: "border-emerald-300",
        badge:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 hover:bg-emerald-200",
      },
      failed: {
        icon: XCircle,
        color: "text-red-600",
        accent: "bg-red-500",
        iconBg: "bg-red-100",
        border: "border-red-300",
        badge:
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200",
      },
    };
    return configs[status] || configs.draft;
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  // Calculate progress percentage
  const totalRecipients = metrics?.totalRecipients || 0;
  const sent = metrics?.sent || 0;
  const progressPercentage =
    totalRecipients > 0 ? (sent / totalRecipients) * 100 : 0;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Not scheduled";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDate(dateString);
  };

  return (
    <Card
      className={`relative w-full transition-all duration-300 border bg-white hover:shadow-waPanel dark:bg-[#0b141a]`}
    >
      {/* Accent strip */}
      <div
        className={`absolute left-0 top-0 h-full w-1 ${statusConfig.accent} rounded-l-lg`}
      />
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          {/* Left Section - Campaign Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`p-3 rounded-lg bg-wa-bg-panelHeader ${statusConfig.iconBg}`}
              >
                <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  {name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={statusConfig.badge}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                  {campaignType && (
                    <Badge variant="outline" className="text-xs">
                      {campaignType}
                    </Badge>
                  )}
                  {/* {variantCount > 1 && (
                    <Badge variant="outline" className="text-xs">
                      {variantCount} variants
                    </Badge>
                  )} */}
                </div>
              </div>
            </div>

            {description && (
              <p className="text-wa-text-secondary-light dark:text-wa-text-secondary-dark text-sm mb-3 line-clamp-2">
                {description}
              </p>
            )}

            {/* Schedule Info */}
            <div className="flex items-center gap-4 text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {scheduleType === "immediate"
                    ? "Immediate"
                    : formatDate(scheduledDate)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span>{capitalize(firstVariantType)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Updated {formatRelativeTime(updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-wa-border text-wa-text-primary-light dark:text-wa-text-primary-dark hover:bg-wa-bg-panelHeader w-8 h-8 cursor-default hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-44 p-1 bg-white dark:bg-gray-900 border-wa-border text-wa-text-primary-light dark:text-wa-text-primary-dark shadow-xl rounded-md cursor-default"
              >
                <button
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 cursor-default"
                  onClick={() => {
                    /* TODO: navigate to view */
                  }}
                >
                  <Eye className="w-4 h-4 opacity-80" />
                  <span className="text-sm">View</span>
                </button>
                <button
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 cursor-default"
                  onClick={() => {
                    /* TODO: navigate to edit */
                  }}
                >
                  <Edit className="w-4 h-4 opacity-80" />
                  <span className="text-sm">Edit</span>
                </button>
                <button
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-md transition-colors duration-150 cursor-default ${
                    status === "running"
                      ? "hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      : "hover:bg-green-50 dark:hover:bg-green-900/20"
                  }`}
                  onClick={() => {
                    /* TODO: start or pause campaign */
                  }}
                >
                  {status === "running" ? (
                    <Pause className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Play className="w-4 h-4 text-green-600" />
                  )}
                  <span
                    className={`text-sm ${
                      status === "running" ? "text-amber-700" : "text-green-600"
                    }`}
                  >
                    {status === "running" ? "Pause" : "Start"}
                  </span>
                </button>
                <button
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 cursor-default"
                  onClick={() => {
                    /* TODO: delete campaign */
                  }}
                >
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600">Delete</span>
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Metrics Section */}
        <div className="border-t border-wa-border pt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Total Recipients */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-wa-text-secondary-light dark:text-wa-text-secondary-dark" />
                <span className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Recipients
                </span>
              </div>
              <div className="text-lg font-semibold text-wa-text-primary-light dark:text-wa-text-primary-dark">
                {totalRecipients.toLocaleString()}
              </div>
            </div>

            {/* Sent */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <MessageSquare className="w-4 h-4 text-wa-text-secondary-light dark:text-wa-text-secondary-dark" />
                <span className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Sent
                </span>
              </div>
              <div className="text-lg font-semibold text-blue-500">
                {metrics?.sent?.toLocaleString() || 0}
              </div>
            </div>

            {/* Delivered */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="w-4 h-4 text-wa-text-secondary-light dark:text-wa-text-secondary-dark" />
                <span className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Delivered
                </span>
              </div>
              <div className="text-lg font-semibold text-green-500">
                {metrics?.delivered?.toLocaleString() || 0}
              </div>
            </div>

            {/* Read */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Eye className="w-4 h-4 text-wa-text-secondary-light dark:text-wa-text-secondary-dark" />
                <span className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Read
                </span>
              </div>
              <div className="text-lg font-semibold text-purple-500">
                {metrics?.read?.toLocaleString() || 0}
              </div>
            </div>

            {/* Failed */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <XCircle className="w-4 h-4 text-wa-text-secondary-light dark:text-wa-text-secondary-dark" />
                <span className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Failed
                </span>
              </div>
              <div className="text-lg font-semibold text-red-500">
                {metrics?.failed?.toLocaleString() || 0}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {status === "running" && totalRecipients > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                {progressPercentage < 50 && (
                  <span className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark"></span>
                )}
                <span className="text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Progress
                </span>
                {progressPercentage >= 50 && (
                  <span className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark"></span>
                )}
              </div>
              <Progress
                value={progressPercentage}
                showDot={true}
                brandColors={true}
                className="h-2 bg-wa-bg-panelHeader-light dark:bg-wa-bg-panelHeader-dark shadow-inner"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignCard;
