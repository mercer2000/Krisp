"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function OutlookReconnectBanner() {
  const [needsReconnection, setNeedsReconnection] = useState(false);

  useEffect(() => {
    fetch("/api/integrations/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.outlookNeedsReconnection) {
          setNeedsReconnection(true);
        }
      })
      .catch(() => {});
  }, []);

  if (!needsReconnection) return null;

  return (
    <div className="bg-amber-600 text-white text-center text-sm py-1.5 px-4">
      Your Outlook connection needs to be reconnected.{" "}
      <Link
        href="/settings/integrations"
        className="underline hover:text-amber-100"
      >
        Reconnect →
      </Link>
    </div>
  );
}
