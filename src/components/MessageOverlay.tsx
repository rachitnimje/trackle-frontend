import React from "react";
import { Button } from "./ui/button";
import { CheckCircle, XCircle, X } from "lucide-react";

interface MessageOverlayProps {
  message: string;
  type: "success" | "error";
  isVisible: boolean;
  onClose: () => void;
}

export const MessageOverlay: React.FC<MessageOverlayProps> = ({
  message,
  type,
  isVisible,
  onClose,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md mx-4 relative animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-zinc-800">
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-zinc-800"
        >
          <X className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </Button>

        {/* Content */}
        <div className="flex items-center space-x-3 pr-8">
          {type === "success" ? (
            <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400 flex-shrink-0" />
          ) : (
            <XCircle className="h-8 w-8 text-red-500 dark:text-red-400 flex-shrink-0" />
          )}
          <div>
            <h3
              className={`font-semibold ${
                type === "success"
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-700 dark:text-red-400"
              }`}
            >
              {type === "success" ? "Success" : "Error"}
            </h3>
            <p className="text-gray-600 dark:text-muted-foreground text-sm mt-1">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
