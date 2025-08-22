import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";

const AlertDialogComponent = ({
  isOpen,
  onClose,
  type = "info",
  title,
  description,
  buttonText = "OK",
  showCancel = false,
  cancelText = "Cancel",
  onConfirm,
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          icon: CheckCircle,
          iconColor: "text-wa-brand dark:text-wa-brand",
          buttonVariant: "default",
          buttonClass: "bg-wa-brand hover:bg-wa-brand/90 text-white",
        };
      case "error":
        return {
          icon: XCircle,
          iconColor: "text-red-600 dark:text-red-400",
          buttonVariant: "default",
          buttonClass: "bg-red-600 hover:bg-red-700 text-white",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          iconColor: "text-yellow-600 dark:text-yellow-400",
          buttonVariant: "default",
          buttonClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
        };
      case "info":
      default:
        return {
          icon: Info,
          iconColor: "text-blue-600 dark:text-blue-400",
          buttonVariant: "default",
          buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
        };
    }
  };

  const styles = getTypeStyles();
  const IconComponent = styles.icon;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start mb-2">
            {/* <IconComponent className={`w-6 h-6 mr-2 ${styles.iconColor}`} /> */}
            <AlertDialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-gray-600 dark:text-gray-300">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="">
          {showCancel && (
            <AlertDialogCancel onClick={handleCancel} className="mt-2 sm:mt-0">
              {cancelText}
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={handleConfirm}
            className={styles.buttonClass}
          >
            {buttonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AlertDialogComponent;
