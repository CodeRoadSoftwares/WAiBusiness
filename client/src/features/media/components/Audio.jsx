import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Clipboard, Download, SquareArrowOutUpRight } from "lucide-react";

const Audio = ({ src, fileName, className = "", createdAt, fileSize }) => {
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
        className={`relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200 bg-gray-50 ${className}`}
        onClick={handleView}
      >
        <div className="flex items-center justify-center h-48 bg-gradient-to-br from-purple-100 to-blue-100">
          <div className="text-center">
            <div className="bg-white bg-opacity-90 rounded-full p-4 mb-4 group-hover:opacity-0 transition-opacity duration-200">
              <svg
                className="w-12 h-12 text-purple-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <p className="text-gray-700 text-sm font-medium group-hover:opacity-0 transition-opacity duration-200">
              Click to play
            </p>
          </div>
        </div>

        {/* Type indicator - subtle overlay */}
        <div className="absolute top-3 right-3 bg-black bg-opacity-60 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium group-hover:opacity-0 transition-opacity duration-200">
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            <span>AUD</span>
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
        <DialogContent className="max-w-2xl max-h-[95vh] p-0 rounded-xl overflow-hidden">
          {/* Header with media details */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
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

          {/* Audio content */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8">
            <div className="text-center space-y-6">
              <div className="bg-white rounded-full w-24 h-24 mx-auto flex items-center justify-center shadow-lg">
                <svg
                  className="w-12 h-12 text-purple-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
              <div className="rounded-full shadow-lg">
                <audio
                  src={src}
                  controls
                  className="w-full border-2 border-purple-300 rounded-full"
                  preload="metadata"
                />
              </div>
            </div>
          </div>

          {/* Footer with action buttons */}
          <div className="bg-white border-t border-gray-200 px-6 py-4">
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

export default Audio;
