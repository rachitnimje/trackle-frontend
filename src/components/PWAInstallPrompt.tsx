"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "@/components/Icons";
import { logger } from "@/utils/logger";

// Custom type for BeforeInstallPromptEvent
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Save the event that triggers the install prompt
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    // Check if app is already installed
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsVisible(false);
      // Optionally store that the app is installed
      localStorage.setItem("pwaInstalled", "true");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check if already installed previously
    const isInstalled = localStorage.getItem("pwaInstalled") === "true";
    if (isInstalled) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === "accepted") {
      logger.log("User accepted the PWA installation", undefined, "PWA");
    } else {
      logger.log("User declined the PWA installation", undefined, "PWA");
    }

    // Clear the saved prompt
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }
  return (
    <div className="fixed bottom-16 right-4 z-50 p-4 rounded-lg bg-card shadow-lg max-w-xs border">
      <div className="flex flex-col space-y-2">
        <div className="text-sm font-medium">Install Trackle App</div>
        <p className="text-xs text-muted-foreground">
          Install this app on your device for quick access and offline
          functionality.
        </p>
        <Button size="sm" onClick={handleInstallClick} className="mt-2">
          <DownloadIcon className="mr-2 h-4 w-4" />
          Install App
        </Button>
      </div>
    </div>
  );
}
