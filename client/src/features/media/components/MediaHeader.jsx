import React, { useState } from "react";
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
import {
  Search,
  Upload,
  Filter,
  X,
  ChevronDown,
  Image,
  Video,
  Music,
  FileText,
  Grid,
  List,
  SortAsc,
} from "lucide-react";
import Div from "@/shared/components/Div";

function MediaHeader({ onSearchChange, onOpenUpload, onTypeFiltersChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [filterValues, setFilterValues] = useState({
    fileType: "",
    dateRange: "",
    sortBy: "createdAt",
  });

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearchChange?.(value);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    onSearchChange?.("");
  };

  const handleFilterSelect = (filter) => {
    let next;
    if (activeFilters.includes(filter)) {
      next = activeFilters.filter((f) => f !== filter);
    } else {
      next = [...activeFilters, filter];
    }
    setActiveFilters(next);
    onTypeFiltersChange?.(next);
  };

  const handleClearAllFilters = () => {
    setActiveFilters([]);
    onTypeFiltersChange?.([]);
  };

  const handleApplyFilters = () => {
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

  const fileTypeOptions = [
    { value: "image", label: "Images", icon: Image },
    { value: "video", label: "Videos", icon: Video },
    { value: "audio", label: "Audio", icon: Music },
    { value: "document", label: "Documents", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image className="w-9 h-9 text-gray-500 dark:text-gray-200" />
          <div className="flex flex-col items-start">
            <h2 className="text-2xl font-semibold text-wa-text-primary-light dark:text-wa-text-primary-dark">
              Media Library
            </h2>
            <span className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
              Manage your media files and assets
            </span>
          </div>
        </div>
        <Button
          onClick={onOpenUpload}
          className="bg-wa-brand hover:bg-wa-brand/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Media
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="space-y-4">
        {/* Search and Filter Row */}
        <div className="flex gap-3 w-full">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-wa-text-secondary-light dark:text-wa-text-secondary-dark" />
            <Input
              placeholder="Search files by name, or caption..."
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

          {/* Filter Button */}
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`border-wa-border text-wa-text-primary-light dark:text-wa-text-primary-dark hover:bg-wa-bg-panelHeader hover:border-wa-brand/50 transition-all duration-200 h-11 px-4 min-w-[120px]`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="file-type"
                        className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark"
                      >
                        File Type
                      </Label>
                      {filterValues.fileType && (
                        <button
                          onClick={() => handleClearFilter("fileType")}
                          className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark hover:text-wa-brand transition-colors duration-200"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <Select
                      value={filterValues.fileType || undefined}
                      onValueChange={(value) =>
                        handleFilterValueChange("fileType", value)
                      }
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-800 border-wa-border text-wa-text-primary-light dark:text-wa-text-primary-dark">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-wa-border shadow-lg">
                        {fileTypeOptions.map((option) => {
                          const IconComponent = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="w-4 h-4" />
                                {option.label}
                              </div>
                            </SelectItem>
                          );
                        })}
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
                        <SelectItem value="year">This Year</SelectItem>
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
                        <SelectItem value="size">File Size</SelectItem>
                        <SelectItem value="type">File Type</SelectItem>
                        <SelectItem value="updatedAt">Last Modified</SelectItem>
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

          {/* View Mode Toggle */}
          <div className="flex border border-wa-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors duration-200 ${
                viewMode === "grid"
                  ? "bg-wa-brand text-white"
                  : "bg-wa-bg-panel text-wa-text-secondary-light dark:text-wa-text-secondary-dark hover:bg-wa-bg-panelHeader"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors duration-200 ${
                viewMode === "list"
                  ? "bg-wa-brand text-white"
                  : "bg-wa-bg-panel text-wa-text-secondary-light dark:text-wa-text-secondary-dark hover:bg-wa-bg-panelHeader disabled:opacity-50"
              }`}
              disabled
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {fileTypeOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => handleFilterSelect(option.value)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 flex items-center gap-2 ${
                  activeFilters.includes(option.value)
                    ? "bg-wa-brand text-white border-wa-brand"
                    : "bg-wa-bg-panel border-wa-border text-wa-text-primary-light dark:text-wa-text-primary-dark hover:bg-wa-bg-panelHeader hover:border-wa-brand/50"
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {option.label}
              </button>
            );
          })}

          {/* Clear All Button - only show when filters are active */}
          {activeFilters.length > 0 && (
            <button
              onClick={handleClearAllFilters}
              className="px-3 py-1.5 text-sm rounded-lg border border-red-300 text-red-600 bg-red-50 dark:bg-red-900/20 dark:border-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MediaHeader;
