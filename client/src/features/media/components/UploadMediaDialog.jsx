import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  X,
  File,
  Image,
  Video,
  Music,
  FileText,
  CheckCircle,
  AlertCircle,
  CloudUpload,
  Trash2,
} from "lucide-react";

function UploadMediaDialog({ open, onOpenChange, onUpload }) {
  const [files, setFiles] = React.useState([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const fileInputRef = React.useRef(null);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith("image/")) return Image;
    if (file.type.startsWith("video/")) return Video;
    if (file.type.startsWith("audio/")) return Music;
    return FileText;
  };

  const getFileType = (file) => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    return "document";
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isFileTooLarge = (file) => {
    return file.size > 10 * 1024 * 1024; // 10MB limit
  };

  const hasOversizedFiles = files.some(isFileTooLarge);

  const removeOversizedFiles = () => {
    setFiles(files.filter((file) => !isFileTooLarge(file)));
  };

  const handleUpload = async () => {
    if (!files.length) return;

    // If there are oversized files, remove them instead of uploading
    if (hasOversizedFiles) {
      removeOversizedFiles();
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("media", file));

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await onUpload?.(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Small delay to show completion
      setTimeout(() => {
        setFiles([]);
        setUploadProgress(0);
        onOpenChange?.(false);
      }, 500);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CloudUpload className="w-6 h-6 text-wa-brand" />
            Upload Media Files
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              isDragOver
                ? "border-wa-brand bg-wa-brand/5"
                : "border-wa-border hover:border-wa-brand/50 hover:bg-wa-bg-panelHeader/30"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
            />

            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-wa-brand/10 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-wa-brand" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-wa-text-primary-light dark:text-wa-text-primary-dark mb-2">
                  Drop files here or click to browse
                </h3>
                <p className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                  Images, videos, audio, PDFs, documents, and more
                </p>
                <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark mt-1">
                  Max 10MB per file • Multiple files allowed
                </p>
              </div>

              <Button
                onClick={openFileDialog}
                variant="outline"
                className="border-wa-brand text-wa-brand hover:bg-wa-brand hover:text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  Selected Files ({files.length})
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiles([])}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((file, index) => {
                  const FileIcon = getFileIcon(file);
                  const fileType = getFileType(file);
                  const tooLarge = isFileTooLarge(file);

                  return (
                    <Card
                      key={index}
                      className={`border ${
                        tooLarge
                          ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                          : "border-wa-border"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              tooLarge
                                ? "bg-red-100 dark:bg-red-800"
                                : "bg-wa-bg-panelHeader"
                            }`}
                          >
                            <FileIcon
                              className={`w-5 h-5 ${
                                tooLarge
                                  ? "text-red-600"
                                  : "text-wa-text-secondary-light dark:text-wa-text-secondary-dark"
                              }`}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-medium truncate ${
                                tooLarge
                                  ? "text-red-800 dark:text-red-200"
                                  : "text-wa-text-primary-light dark:text-wa-text-primary-dark"
                              }`}
                            >
                              {file.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  tooLarge ? "border-red-300 text-red-700" : ""
                                }`}
                              >
                                {fileType}
                              </Badge>
                              <span
                                className={`text-xs ${
                                  tooLarge
                                    ? "text-red-600"
                                    : "text-wa-text-secondary-light dark:text-wa-text-secondary-dark"
                                }`}
                              >
                                {formatFileSize(file.size)}
                              </span>
                              {tooLarge && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Too Large
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 w-8 h-8 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isSubmitting && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-wa-brand border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-wa-text-primary-light dark:text-wa-text-primary-dark">
                  Uploading files...
                </span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark text-center">
                {uploadProgress}% complete
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-wa-border">
            <Button
              variant="ghost"
              onClick={() => onOpenChange?.(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!files.length || isSubmitting}
              className={`${
                hasOversizedFiles
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-wa-brand hover:bg-wa-brand/90 text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : hasOversizedFiles ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Remove oversized files
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  {files.length > 0
                    ? `Upload ${files.length} file${
                        files.length !== 1 ? "s" : ""
                      }`
                    : "Upload"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default UploadMediaDialog;
