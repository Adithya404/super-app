"use client";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">{children}</div>;
}
