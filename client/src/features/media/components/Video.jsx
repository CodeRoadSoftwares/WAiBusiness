import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Clipboard, Download, Eye, Play } from "lucide-react";

const Video = ({ src, fileName, className = "", createdAt, fileSize }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  const handleView = () => {
    setIsModalOpen(true);
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

  return (
    <>
      <div
        className={`relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200 ${className}`}
        onClick={handleView}
      >
        <video
          src={src}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          preload="metadata"
        />

        {/* Type indicator - subtle overlay */}
        <div className="absolute top-3 right-3 bg-black bg-opacity-60 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium group-hover:opacity-0 transition-opacity duration-200">
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>VID</span>
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
              <Play className="w-6 h-6 text-gray-700" />
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] p-0 rounded-xl overflow-hidden flex flex-col">
          {/* Header with media details */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {fileName}
              </h3>
              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                {fileSize ? (
                  <span>{(fileSize / 1024 / 1024).toFixed(2)} MB</span>
                ) : null}
                {createdAt && (
                  <span>{new Date(createdAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>

          {/* Video content - flexible container */}
          <div className="bg-gray-50 p-4 flex-1 flex items-center justify-center min-h-0 overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <video
                src={src}
                controls
                className="max-w-full max-h-full rounded-lg shadow-lg"
                style={{ maxHeight: "calc(95vh - 200px)" }}
                autoPlay
              />
            </div>
          </div>

          {/* Footer with action buttons */}
          <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleCopyUrl}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy URL"
              >
                <Clipboard className="w-4 h-4" />
                <span className="text-sm font-medium">Copy URL</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Download</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Video;
