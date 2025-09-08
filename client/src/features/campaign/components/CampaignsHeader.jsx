import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Div from "@/shared/components/Div";
import { Filter, Plus, Search, Megaphone, X, ChevronDown } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function CampaignsHeader() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [filterValues, setFilterValues] = useState({
    campaignType: "",
    dateRange: "",
    sortBy: "createdAt",
  });

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleFilterSelect = (filter) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter((f) => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const handleClearAllFilters = () => {
    setActiveFilters([]);
  };

  const handleApplyFilters = () => {
    // Here you would apply the filters to your data
    console.log("Applying filters:", filterValues);
    setShowFilters(false);
  };

  const handleFilterValueChange = (key, value) => {
    setFilterValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleClearFilter = (key) => {
    setFilterValues((prev) => ({
      ...prev,
      [key]: "",
    }));
  };

  return (
    <div size="lg" className="space-y-6">
      {/* Main Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-9 h-9 text-gray-500 dark:text-gray-200 -rotate-12" />
          <div className="flex flex-col items-start">
            <h2 className="text-2xl font-semibold text-wa-text-primary-light dark:text-wa-text-primary-dark">
              Campaigns
            </h2>
            <span className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
              Monitor and manage your WhatsApp campaigns
            </span>
          </div>
        </div>
        <Button
          onClick={() => navigate("/campaign/create")}
          className="bg-wa-brand hover:bg-wa-brand/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Search and Filter Bar - Full Width */}
      <div className="space-y-4">
        {/* Full Width Search and Filter Row */}
        <div className="flex gap-3 w-full">
          {/* Search Bar - Takes most of the width */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-wa-text-secondary-light dark:text-wa-text-secondary-dark" />
            <Input
              placeholder="Search campaigns by name, description, or status..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-10 bg-wa-bg-panel border-wa-border text-wa-text-primary-light dark:text-wa-text-primary-dark placeholder:text-wa-text-secondary-light dark:placeholder:text-wa-text-secondary-dark focus:ring-2 focus:ring-wa-brand/20 focus:border-wa-brand transition-all duration-200 h-11"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-wa-bg-panelHeader rounded-full transition-colors duration-200"
              >
                <X className="w-4 h-4 text-wa-text-secondary-light dark:text-wa-text-secondary-dark" />
              </button>
            )}
          </div>

          {/* Filter Button with Shadcn Popover */}
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`border-wa-border text-wa-text-primary-light dark:text-wa-text-primary-dark hover:bg-wa-bg-panelHeader hover:border-wa-brand/50 transition-all duration-200 h-11 px-4 min-w-[120px] ${
                  activeFilters.length > 0
                    ? "bg-wa-brand/10 border-wa-brand text-wa-brand"
                    : ""
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFilters.length > 0 && (
                  <span className="ml-2 bg-wa-brand text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                    {activeFilters.length}
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                    showFilters ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 bg-white dark:bg-gray-900 border-wa-border text-wa-text-primary-light dark:text-wa-text-primary-dark shadow-xl"
              align="end"
              sideOffset={8}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-wa-text-primary-light dark:text-wa-text-primary-dark">
                    Filter Campaigns
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="campaign-type"
                        className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark"
                      >
                        Campaign Type
                      </Label>
                      {filterValues.campaignType && (
                        <button
                          onClick={() => handleClearFilter("campaignType")}
                          className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark hover:text-wa-brand transition-colors duration-200"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <Select
                      value={filterValues.campaignType || undefined}
                      onValueChange={(value) =>
                        handleFilterValueChange("campaignType", value)
                      }
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-800 border-wa-border text-wa-text-primary-light dark:text-wa-text-primary-dark">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-wa-border shadow-lg">
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="transactional">
                          Transactional
                        </SelectItem>
                        <SelectItem value="notification">
                          Notification
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="date-range"
                        className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark"
                      >
                        Date Range
                      </Label>
                      {filterValues.dateRange && (
                        <button
                          onClick={() => handleClearFilter("dateRange")}
                          className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark hover:text-wa-brand transition-colors duration-200"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <Select
                      value={filterValues.dateRange || undefined}
                      onValueChange={(value) =>
                        handleFilterValueChange("dateRange", value)
                      }
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-800 border-wa-border text-wa-text-primary-light dark:text-wa-text-primary-dark">
                        <SelectValue placeholder="All Time" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-wa-border shadow-lg">
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="sort-by"
                        className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark"
                      >
                        Sort By
                      </Label>
                      {filterValues.sortBy !== "createdAt" && (
                        <button
                          onClick={() =>
                            handleFilterValueChange("sortBy", "createdAt")
                          }
                          className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark hover:text-wa-brand transition-colors duration-200"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <Select
                      value={filterValues.sortBy}
                      onValueChange={(value) =>
                        handleFilterValueChange("sortBy", value)
                      }
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-800 border-wa-border text-wa-text-primary-light dark:text-wa-text-primary-dark">
                        <SelectValue placeholder="Created Date" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-wa-border shadow-lg">
                        <SelectItem value="createdAt">Created Date</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="updatedAt">Last Updated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-wa-border">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(false)}
                    className="border-wa-border text-wa-text-primary-light dark:text-wa-text-primary-dark hover:bg-wa-bg-panelHeader"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApplyFilters}
                    className="bg-wa-brand hover:bg-wa-brand/90 text-white"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Filter Badges Row */}
        <div className="flex items-center gap-2 flex-wrap">
          {["Running", "Draft", "Paused", "Scheduled"].map((status) => (
            <button
              key={status}
              onClick={() => handleFilterSelect(status.toLowerCase())}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 ${
                activeFilters.includes(status.toLowerCase())
                  ? "bg-wa-brand text-white border-wa-brand"
                  : "bg-wa-bg-panel border-wa-border text-wa-text-primary-light dark:text-wa-text-primary-dark hover:bg-wa-bg-panelHeader hover:border-wa-brand/50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div className="flex flex-col items-start gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                Active filters
              </span>
              <button
                onClick={handleClearAllFilters}
                className="text-sm text-red-400 dark:text-red-400 transition-colors duration-200  dark:border-red-600 dark:hover:bg-red-900 flex items-center gap-1 hover:text-red-600 dark:hover:text-red-400"
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            </div>
            <div className="flex items-start gap-2 flex-wrap">
              <div className="flex items-start gap-2 flex-wrap">
                {activeFilters.map((filter) => (
                  <div
                    key={filter}
                    className="flex items-center gap-1 bg-wa-brand/10 text-wa-brand px-3 py-1 rounded-lg text-sm border border-wa-brand/20"
                  >
                    <span className="capitalize">{filter}</span>
                    <button
                      onClick={() => handleFilterSelect(filter)}
                      className="hover:bg-wa-brand/20 rounded-full p-0.5 transition-colors duration-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CampaignsHeader;
