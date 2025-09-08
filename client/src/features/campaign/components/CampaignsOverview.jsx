import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Div from "@/shared/components/Div";
import { RefreshCw, ChartNoAxesGantt } from "lucide-react";
import React from "react";
import { FaPause, FaPlay, FaSave } from "react-icons/fa";
import { MdScheduleSend } from "react-icons/md";

function CampaignsOverview({
  running,
  paused,
  draft,
  scheduled,
  onRefresh,
  isLoading,
  error,
}) {
  return (
    <Div size="lg" className="space-y-6">
      <div className="w-full flex items-between justify-between">
        <div className="flex items-center gap-2">
          <ChartNoAxesGantt className="w-10 h-10 text-gray-500 dark:text-gray-200" />
          <div className="flex flex-col items-start">
            <h2 className="text-2xl font-semibold text-wa-text-primary-light dark:text-wa-text-primary-dark">
              Overview
            </h2>
            <span className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
              Real-time monitoring
            </span>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="hover:bg-wa-brand/10 hover:border-wa-brand transition-all duration-200"
            onClick={onRefresh}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Running Campaigns Card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-xl p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <FaPlay className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {running || 0}
              </div>
              <div className="text-sm text-green-500 dark:text-green-400 font-medium">
                Active
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-wa-text-primary-light dark:text-wa-text-primary-dark">
              Running Campaigns
            </h3>
            <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
              Currently executing
            </p>
          </div>
        </div>

        {/* Paused Campaigns Card */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <FaPause className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {paused || 0}
              </div>
              <div className="text-sm text-amber-500 dark:text-amber-400 font-medium">
                Paused
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-wa-text-primary-light dark:text-wa-text-primary-dark">
              Paused Campaigns
            </h3>
            <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
              Temporarily stopped
            </p>
          </div>
        </div>

        {/* Draft Campaigns Card */}
        <div className="bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-950/30 dark:to-indigo-950/30 border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-200 dark:bg-gray-900/50 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <FaSave className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                {draft || 0}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Draft
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-wa-text-primary-light dark:text-wa-text-primary-dark">
              Draft Campaigns
            </h3>
            <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
              Ready to launch
            </p>
          </div>
        </div>

        {/* Scheduled Campaigns Card */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border border-purple-200 dark:border-purple-800 rounded-xl p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <MdScheduleSend className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {scheduled || 0}
              </div>
              <div className="text-sm text-purple-500 dark:text-purple-400 font-medium">
                Scheduled
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-wa-text-primary-light dark:text-wa-text-primary-dark">
              Scheduled Campaigns
            </h3>
            <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
              Set for future launch
            </p>
          </div>
        </div>
      </div>
    </Div>
  );
}

export default CampaignsOverview;
