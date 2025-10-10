import { Clipboard, Download, SquareArrowOutUpRight } from "lucide-react";
import React, { useState } from "react";

const Document = ({ src, fileName, mimeType, className = "" }) => {
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  const handleView = () => {
    window.open(src, "_blank");
  };

  const handleCopyUrl = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(src);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "download";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading:", error);
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes("pdf")) {
      return (
        <svg
          className="w-12 h-12 text-red-600"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      );
    }
    if (mimeType?.includes("word") || mimeType?.includes("document")) {
      return (
        <svg
          className="w-12 h-12 text-blue-600"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      );
    }
    if (mimeType?.includes("excel") || mimeType?.includes("spreadsheet")) {
      return (
        <svg
          className="w-12 h-12 text-green-600"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      );
    }
    if (mimeType?.includes("csv")) {
      return (
        <svg
          className="w-12 h-12 text-green-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      );
    }
    // Default document icon
    return (
      <svg
        className="w-12 h-12 text-gray-600"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
      </svg>
    );
  };

  const getFileTypeColor = (mimeType) => {
    if (mimeType?.includes("pdf")) return "from-red-100 to-red-200";
    if (mimeType?.includes("word") || mimeType?.includes("document"))
      return "from-blue-100 to-blue-200";
    if (mimeType?.includes("excel") || mimeType?.includes("spreadsheet"))
      return "from-green-100 to-green-200";
    if (mimeType?.includes("csv")) return "from-green-100 to-green-200";
    return "from-gray-100 to-gray-200";
  };

  const getFileTypeName = (mimeType) => {
    if (mimeType?.includes("pdf")) return "PDF";
    if (mimeType?.includes("word") || mimeType?.includes("document"))
      return "DOC";
    if (mimeType?.includes("excel") || mimeType?.includes("spreadsheet"))
      return "XLS";
    if (mimeType?.includes("csv")) return "CSV";
    return "DOC";
  };

  return (
    <div
      className={`relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200 bg-gray-50 ${className}`}
      onClick={handleView}
    >
      <div
        className={`flex items-center justify-center h-48 bg-gradient-to-br ${getFileTypeColor(
          mimeType
        )}`}
      >
        <div className="text-center">
          <div className="bg-white bg-opacity-90 rounded-full p-4 mb-4 group-hover:opacity-0 transition-opacity duration-200">
            {getFileIcon(mimeType)}
          </div>
          <p className="text-gray-700 text-sm font-medium group-hover:opacity-0 transition-opacity duration-200">
            Click to open
          </p>
        </div>
      </div>

      {/* Type indicator - subtle overlay */}
      <div className="absolute top-3 right-3 bg-black bg-opacity-60 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium group-hover:opacity-0 transition-opacity duration-200">
        <div className="flex items-center space-x-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
          <span>{getFileTypeName(mimeType).substring(0, 3).toUpperCase()}</span>
        </div>
      </div>

      {/* Hover actions overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
        {/* Center view button */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleView}
            className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transition-all duration-200"
          >
            <SquareArrowOutUpRight className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Top right corner actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
          <button
            onClick={handleCopyUrl}
            className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200"
            title="Copy URL"
          >
            <Clipboard className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={handleDownload}
            className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200"
            title="Download"
          >
            <Download className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        {/* Copied Toast */}
        {showCopiedToast && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
              <p className="text-sm font-medium text-gray-900">Copied!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Document;
