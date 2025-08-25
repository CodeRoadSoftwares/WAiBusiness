import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Clock,
  Globe,
  Zap,
  CalendarDays,
  ChevronDownIcon,
  Timer,
  Search,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group";
import { Calendar as CalendarComponent } from "../../../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import timezonesData from "../../../shared/constants/timezones.json";

const ScheduleSection = ({ formData, onFormChange }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [selectedTimezone, setSelectedTimezone] = useState("IST");
  const [scheduleType, setScheduleType] = useState("scheduled");
  const [customDelay, setCustomDelay] = useState(0);
  const [delayUnit, setDelayUnit] = useState("minutes");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState("");
  const [timezoneSelectOpen, setTimezoneSelectOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const timezoneSearchRef = useRef(null);
  const timezoneButtonRef = useRef(null);

  // Use ref to prevent infinite loops
  const isUpdating = useRef(false);

  // Filter timezones based on search
  const filteredTimezones = React.useMemo(() => {
    if (!timezoneSearch.trim()) {
      return timezonesData;
    }

    const searchLower = timezoneSearch.toLowerCase().trim();
    return timezonesData.filter((timezone) => {
      return (
        timezone.value.toLowerCase().includes(searchLower) ||
        timezone.label.toLowerCase().includes(searchLower) ||
        timezone.description.toLowerCase().includes(searchLower) ||
        timezone.offset.toLowerCase().includes(searchLower)
      );
    });
  }, [timezoneSearch]);

  // Quick delay presets
  const quickDelays = [
    { label: "5 minutes", value: 5, unit: "minutes" },
    { label: "15 minutes", value: 15, unit: "minutes" },
    { label: "1 hour", value: 1, unit: "hours" },
    { label: "2 hours", value: 2, unit: "hours" },
    { label: "1 day", value: 1, unit: "days" },
  ];

  // Initialize with current date/time if not set - only run once on mount
  useEffect(() => {
    if (!formData.scheduledDate) {
      const now = new Date();
      setSelectedDate(now);
      setSelectedTime(formatTime(now));
    } else {
      const scheduledDate = new Date(formData.scheduledDate);
      setSelectedDate(scheduledDate);
      setSelectedTime(formatTime(scheduledDate));
    }

    if (formData.scheduleType) {
      setScheduleType(formData.scheduleType);

      // If it's scheduled type, ensure we have the current date/time set
      if (formData.scheduleType === "scheduled") {
        if (!formData.scheduledDate) {
          const now = new Date();
          const scheduledDateTime = new Date(now);
          scheduledDateTime.setHours(9, 0, 0, 0); // Set to 9:00 AM by default

          // Convert local time to UTC using the new function
          const utcTime = convertLocalToUTC(scheduledDateTime, "IST");
          updateFormData("scheduledDate", utcTime.toISOString());
          updateFormData("timeZone", "IST");
        }
      }
    }
    if (formData.timeZone) {
      // Check if the timezone exists in our timezones data
      const timezoneExists = timezonesData.find(
        (tz) => tz.value === formData.timeZone
      );
      if (timezoneExists) {
        setSelectedTimezone(formData.timeZone);
      }
    } else {
      // Set default timezone if none is set
      setSelectedTimezone("IST");
      updateFormData("timeZone", "IST");
    }
    if (formData.customDelay) {
      setCustomDelay(formData.customDelay);
    }
    if (formData.delayUnit) {
      setDelayUnit(formData.delayUnit);
    }
  }, []); // Empty dependency array - only run once on mount

  // Handle click outside to close timezone dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (timezoneSelectOpen && !event.target.closest(".timezone-dropdown")) {
        setTimezoneSelectOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [timezoneSelectOpen]);

  // Calculate dropdown position
  const calculateDropdownPosition = () => {
    if (timezoneButtonRef.current) {
      const rect = timezoneButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  // Helper function to update form data safely
  const updateFormData = (field, value) => {
    if (!isUpdating.current) {
      isUpdating.current = true;
      console.log(`Updating form data: ${field} =`, value);
      onFormChange(field, value);
      // Reset the flag after a shorter delay to allow rapid updates
      setTimeout(() => {
        isUpdating.current = false;
      }, 10);
    } else {
      // If already updating, queue this update
      setTimeout(() => {
        updateFormData(field, value);
      }, 20);
    }
  };

  // Handle schedule type changes
  const handleScheduleTypeChange = (newScheduleType) => {
    setScheduleType(newScheduleType);

    if (newScheduleType === "immediate") {
      updateFormData("scheduleType", newScheduleType);
      updateFormData("scheduledDate", null);
      updateFormData("customDelay", 0);
      updateFormData("delayUnit", "minutes");
    } else if (newScheduleType === "delayed") {
      updateFormData("scheduleType", newScheduleType);
      updateFormData("customDelay", customDelay);
      updateFormData("delayUnit", delayUnit);
      updateFormData("scheduledDate", null);
    } else if (newScheduleType === "scheduled") {
      updateFormData("scheduleType", newScheduleType);
      if (selectedDate && selectedTime) {
        const [hours, minutes] = selectedTime.split(":");
        const scheduledDateTime = new Date(selectedDate);
        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Convert local time to UTC using the new function
        const utcTime = convertLocalToUTC(scheduledDateTime, selectedTimezone);
        updateFormData("scheduledDate", utcTime.toISOString());
        updateFormData("timeZone", selectedTimezone);
      }
    }
  };

  // Convert local time to UTC
  const convertLocalToUTC = (localDate, timezone) => {
    const selectedTzData = timezonesData.find((tz) => tz.value === timezone);
    if (!selectedTzData) return localDate;

    const offsetStr = selectedTzData.offset;
    const match = offsetStr.match(/^([+-]?)(\d{1,2}):?(\d{2})?$/);
    if (!match) return localDate;

    const sign = match[1] === "-" ? -1 : 1;
    const hours = parseInt(match[2]);
    const minutes = match[3] ? parseInt(match[3]) : 0;
    const totalMinutes = sign * (hours * 60 + minutes);

    // Add the offset to convert to UTC
    return new Date(localDate.getTime() + totalMinutes * 60 * 1000);
  };

  // Handle quick delay selection
  const handleQuickDelay = (delay, unit) => {
    setCustomDelay(delay);
    setDelayUnit(unit);

    // Update form data immediately when quick delay is selected
    updateFormData("customDelay", delay);
    updateFormData("delayUnit", unit);
    updateFormData("scheduleType", "delayed");
    updateFormData("scheduledDate", null);
  };

  // Handle custom delay changes
  const handleCustomDelayChange = (newDelay) => {
    setCustomDelay(newDelay);
    if (scheduleType === "delayed") {
      updateFormData("customDelay", newDelay);
    }
  };

  // Handle delay unit changes
  const handleDelayUnitChange = (newUnit) => {
    setDelayUnit(newUnit);
    if (scheduleType === "delayed") {
      updateFormData("delayUnit", newUnit);
    }
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setDatePickerOpen(false);

    // Update form data immediately when date changes
    if (scheduleType === "scheduled" && selectedTime) {
      const [hours, minutes] = selectedTime.split(":");
      const scheduledDateTime = new Date(date);
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Convert local time to UTC using the new function
      const utcTime = convertLocalToUTC(scheduledDateTime, selectedTimezone);
      updateFormData("scheduledDate", utcTime.toISOString());
    }
  };

  // Handle time changes
  const handleTimeChange = (time) => {
    setSelectedTime(time);
    if (scheduleType === "scheduled") {
      const [hours, minutes] = time.split(":");
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Convert local time to UTC using the new function
      const utcTime = convertLocalToUTC(scheduledDateTime, selectedTimezone);
      updateFormData("scheduledDate", utcTime.toISOString());
    }
  };

  // Handle timezone changes
  const handleTimezoneChange = (timezone) => {
    setSelectedTimezone(timezone);
    setTimezoneSearch(""); // Clear search when timezone is selected

    if (scheduleType === "scheduled") {
      updateFormData("timeZone", timezone);
      if (selectedDate && selectedTime) {
        const [hours, minutes] = selectedTime.split(":");
        const scheduledDateTime = new Date(selectedDate);
        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Convert local time to UTC using the new function
        const utcTime = convertLocalToUTC(scheduledDateTime, timezone);
        updateFormData("scheduledDate", utcTime.toISOString());
      }
    }
  };

  const formatTime = (date) => {
    return date.toTimeString().slice(0, 5);
  };

  // Format time in 12-hour AM/PM format
  const formatTime12Hour = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const getDelayedTimePreview = () => {
    const now = new Date();
    let scheduledTime;

    if (delayUnit === "minutes") {
      scheduledTime = new Date(now.getTime() + customDelay * 60 * 1000);
    } else if (delayUnit === "hours") {
      scheduledTime = new Date(now.getTime() + customDelay * 60 * 60 * 1000);
    } else if (delayUnit === "days") {
      scheduledTime = new Date(
        now.getTime() + customDelay * 24 * 60 * 60 * 1000
      );
    }

    // Format time in 12-hour AM/PM format
    const hours = scheduledTime.getHours();
    const minutes = scheduledTime.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    const formattedTime = `${hour12.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")} ${ampm}`;

    return `${scheduledTime.toLocaleDateString()} at ${formattedTime}`;
  };

  // Get selected timezone display info
  const getSelectedTimezoneInfo = () => {
    const tz = timezonesData.find((t) => t.value === selectedTimezone);
    if (!tz) return selectedTimezone;
    return `${tz.label} (${tz.offset})`;
  };

  return (
    <div className="space-y-6">
      {/* Schedule Type Selection with Enhanced Radio Buttons */}
      <div className="space-y-4">
        <RadioGroup
          value={scheduleType}
          onValueChange={handleScheduleTypeChange}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          {/* Immediate Option */}
          <div className="group relative">
            <RadioGroupItem
              value="immediate"
              id="immediate"
              className="sr-only"
            />
            <Label
              htmlFor="immediate"
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                scheduleType === "immediate"
                  ? "border-wa-brand bg-wa-brand/5 dark:bg-wa-brand/10 shadow-sm"
                  : "border-wa-border-light dark:border-wa-border-dark hover:border-wa-brand/30 hover:bg-wa-brand/5 dark:hover:bg-wa-brand/10"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-200 ${
                  scheduleType === "immediate"
                    ? "bg-wa-brand text-white"
                    : "bg-wa-brand/10 text-wa-brand"
                }`}
              >
                <Zap className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  Send Immediately
                </div>
                <div className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Campaign will be sent right away
                </div>
              </div>
            </Label>
          </div>

          {/* Delayed Option */}
          <div className="group relative">
            <RadioGroupItem value="delayed" id="delayed" className="sr-only" />
            <Label
              htmlFor="delayed"
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                scheduleType === "delayed"
                  ? "border-wa-brand bg-wa-brand/5 dark:bg-wa-brand/10 shadow-sm"
                  : "border-wa-border-light dark:border-wa-border-dark hover:border-wa-brand/30 hover:bg-wa-brand/5 dark:hover:bg-wa-brand/10"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-200 ${
                  scheduleType === "delayed"
                    ? "bg-wa-brand text-white"
                    : "bg-wa-brand/10 text-wa-brand"
                }`}
              >
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  Send After Delay
                </div>
                <div className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Send campaign after a specified time
                </div>
              </div>
            </Label>
          </div>

          {/* Scheduled Option */}
          <div className="group relative">
            <RadioGroupItem
              value="scheduled"
              id="scheduled"
              className="sr-only"
            />
            <Label
              htmlFor="scheduled"
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                scheduleType === "scheduled"
                  ? "border-wa-brand bg-wa-brand/5 dark:bg-wa-brand/10 shadow-sm"
                  : "border-wa-border-light dark:border-wa-border-dark hover:border-wa-brand/30 hover:bg-wa-brand/5 dark:hover:bg-wa-brand/10"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-200 ${
                  scheduleType === "scheduled"
                    ? "bg-wa-brand text-white"
                    : "bg-wa-brand/10 text-wa-brand"
                }`}
              >
                <CalendarDays className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  Schedule for Later
                </div>
                <div className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Pick specific date and time
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Quick Delay Options - Only show for delayed */}
      {scheduleType === "delayed" && (
        <div>
          <div className="flex gap-1">
            <Zap className="w-5 h-5 text-gray-500" />

            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
              Quick delay options
            </Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickDelays.map((delay) => (
              <Button
                key={`${delay.value}-${delay.unit}`}
                variant="outline"
                size="sm"
                onClick={() => handleQuickDelay(delay.value, delay.unit)}
                className={`${
                  customDelay === delay.value && delayUnit === delay.unit
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : ""
                }`}
              >
                {delay.label}
              </Button>
            ))}
          </div>

          <div className="mt-3 flex items-center space-x-3">
            <Input
              type="number"
              min="1"
              value={customDelay}
              onChange={(e) =>
                handleCustomDelayChange(parseInt(e.target.value) || 0)
              }
              className="w-20"
            />
            <Select value={delayUnit} onValueChange={handleDelayUnitChange}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="days">Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Date & Time Picker - Only show for scheduled */}
      {scheduleType === "scheduled" && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1">
                <CalendarDays className="w-5 h-5 text-gray-500" />
                <Label htmlFor="date-picker" className="px-1">
                  Date
                </Label>
              </div>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date-picker"
                    className="w-32 justify-between font-normal"
                  >
                    {selectedDate
                      ? selectedDate.toLocaleDateString()
                      : "Select date"}
                    <ChevronDownIcon className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="start"
                >
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    captionLayout="dropdown"
                    onSelect={(date) => {
                      handleDateSelect(date);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1">
                <Timer className="w-5 h-5 text-gray-500" />
                <Label htmlFor="time-picker" className="px-1">
                  Time
                </Label>
              </div>
              <Input
                type="time"
                id="time-picker"
                step="1"
                value={selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none w-32"
              />
            </div>
          </div>
        </div>
      )}

      {/* Timezone Selection - Only show for scheduled */}
      {scheduleType === "scheduled" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Globe className="w-5 h-5 text-gray-500" />
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Timezone
            </Label>
          </div>

          {/* Timezone Selection */}
          <div className="relative">
            <button
              ref={timezoneButtonRef}
              type="button"
              onClick={() => {
                if (!timezoneSelectOpen) {
                  calculateDropdownPosition();
                }
                setTimezoneSelectOpen(!timezoneSelectOpen);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md"
            >
              <span>{getSelectedTimezoneInfo()}</span>
              <ChevronDownIcon className="w-4 h-4 opacity-50" />
            </button>

            {timezoneSelectOpen &&
              createPortal(
                <div
                  className="timezone-dropdown fixed z-50 bg-background border border-input rounded-md shadow-lg"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`,
                  }}
                >
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        ref={timezoneSearchRef}
                        placeholder="Search timezones..."
                        value={timezoneSearch}
                        onChange={(e) => setTimezoneSearch(e.target.value)}
                        className="pl-8"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {filteredTimezones.map((timezone) => (
                      <button
                        key={timezone.value}
                        type="button"
                        onClick={() => {
                          handleTimezoneChange(timezone.value);
                          setTimezoneSelectOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                      >
                        <div className="flex flex-col items-start space-y-1 w-full">
                          <div className="flex items-center space-x-2 w-full">
                            <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="font-medium truncate">
                              {timezone.label}
                            </span>
                            <span className="text-sm text-gray-500 font-mono flex-shrink-0">
                              ({timezone.offset})
                            </span>
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400 ml-6 leading-relaxed break-words">
                            {timezone.description}
                          </span>
                        </div>
                      </button>
                    ))}
                    {filteredTimezones.length === 0 && (
                      <div className="p-3 text-center text-gray-500">
                        No timezones found matching "{timezoneSearch}"
                      </div>
                    )}
                  </div>
                </div>,
                document.body
              )}
          </div>
        </div>
      )}

      {/* Recurring Options - Disabled for now */}
      {/* <div className="space-y-3 opacity-50 pointer-events-none">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={false}
            disabled
            className="rounded border-gray-300"
          />
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Set up recurring campaigns (Coming Soon)
          </Label>
        </div>
      </div> */}

      {/* Schedule Preview */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {scheduleType === "immediate" ? (
              <Zap className="w-6 h-6 text-wa-brand" />
            ) : scheduleType === "delayed" ? (
              <Clock className="w-6 h-6 text-wa-brand" />
            ) : (
              <CalendarDays className="w-6 h-6 text-wa-brand" />
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {scheduleType === "immediate"
                ? "Campaign will start right away!"
                : scheduleType === "delayed"
                ? `Campaign will start after ${customDelay} ${
                    customDelay === 1 && delayUnit.endsWith("s")
                      ? delayUnit.slice(0, -1)
                      : delayUnit
                  }`
                : `Campaign will start on ${
                    selectedDate
                      ? `${selectedDate.toLocaleString("en-US", {
                          day: "2-digit",
                        })} ${selectedDate.toLocaleString("en-US", {
                          month: "short",
                        })}`
                      : ""
                  } at ${formatTime12Hour(selectedTime)}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSection;
