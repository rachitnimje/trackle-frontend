"use client";
import React, { useEffect, useState } from "react";
import { isMobileDevice } from "@/lib/utils";
import MobileOnly from "@/components/MobileOnly";


interface MobileGuardProps {
  children: React.ReactNode;
}

const MobileGuard: React.FC<MobileGuardProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (!isMobile) {
    // Only show MobileOnly page, no children (no navbars)
    return <MobileOnly />;
  }
  return <>{children}</>;
};

export default MobileGuard;
