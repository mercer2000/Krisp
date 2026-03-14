import SupportChatWidgetLoader from "@/components/support/SupportChatWidgetLoader";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark bg-[#0a0e1a] min-h-screen scroll-smooth">
      {children}
      <SupportChatWidgetLoader />
    </div>
  );
}
