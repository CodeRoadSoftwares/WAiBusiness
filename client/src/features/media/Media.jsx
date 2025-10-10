import React from "react";
import MediaHeader from "./components/MediaHeader";
import UploadMediaDialog from "./components/UploadMediaDialog";
import { useUploadMediaMutation } from "./api/mediaApi";
import Div from "@/shared/components/Div";
import DisplayMedia from "./components/DisplayMedia";

function Media() {
  const [types, setTypes] = React.useState([]);
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [uploadMedia] = useUploadMediaMutation();

  const handleOpenUpload = () => setIsUploadOpen(true);

  const handleUpload = async (formData) => {
    try {
      await uploadMedia(formData).unwrap();
    } catch {
      // noop for now; we'll handle this later. Show toast error.
    }
  };

  return (
    <Div size="lg" className="space-y-4 max-w-7xl mx-auto">
      <MediaHeader
        onOpenUpload={handleOpenUpload}
        onTypeFiltersChange={setTypes}
      />
      <DisplayMedia selectedTypes={types} />

      <UploadMediaDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onUpload={handleUpload}
      />
    </Div>
  );
}

export default Media;
