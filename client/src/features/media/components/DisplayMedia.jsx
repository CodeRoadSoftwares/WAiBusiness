import React from "react";
import { useGetMediaQuery } from "../api/mediaApi";
import Image from "./Image";
import Video from "./Video";
import Audio from "./Audio";
import Document from "./Document";
import Spinner from "@/shared/components/Spinner";

function DisplayMedia({ selectedTypes = [] }) {
  const { data, isLoading, error } = useGetMediaQuery(
    {
      page: 1,
      limit: 0,
      ...(selectedTypes && selectedTypes.length > 0
        ? { type: selectedTypes.join(",") }
        : {}),
    },
    { refetchOnMountOrArgChange: true }
  );

  if (isLoading)
    return <Spinner size={24} theme="brand" text="Getting Media..." />;
  if (error) return <div>Error: {error.message}</div>;

  const media = data?.data || [];
  const pagination = data?.pagination;

  console.log("media", media);
  console.log("pagination", pagination);

  const renderMediaItem = (item) => {
    const commonProps = {
      key: item._id,
      src: item.url,
      fileName: item.fileName,
      mimeType: item.mimeType,
      createdAt: item.createdAt,
      fileSize: item.fileSize || 0,
    };

    switch (item.type) {
      case "image":
        return <Image {...commonProps} />;
      case "video":
        return <Video {...commonProps} />;
      case "audio":
        return <Audio {...commonProps} />;
      case "document":
        return <Document {...commonProps} />;
      default:
        return <Document {...commonProps} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {media.map(renderMediaItem)}
      </div>

      {/* Empty State */}
      {media.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No media found
          </h3>
          <p className="text-gray-500">
            Upload some media files to get started.
          </p>
        </div>
      )}
    </div>
  );
}

export default DisplayMedia;
