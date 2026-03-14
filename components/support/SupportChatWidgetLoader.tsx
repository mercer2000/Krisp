"use client";

import dynamic from "next/dynamic";

const SupportChatWidget = dynamic(
  () => import("@/components/support/SupportChatWidget"),
  { ssr: false }
);

export default function SupportChatWidgetLoader() {
  return <SupportChatWidget />;
}
