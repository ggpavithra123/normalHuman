"use client";

import dynamic from "next/dynamic";

const Kbar = dynamic(() => import("@/app/mail/components/kbar"), { ssr: false });

export default function KbarWrapper({ children }: { children: React.ReactNode }) {
  return <Kbar>{children}</Kbar>;
}