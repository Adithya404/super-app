"use client";

import Image from "next/image";
// import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function BrandLogo() {
  // const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-12 w-48" />; // prevent layout shift

  return (
    <Image
      src={"/Brand-new.svg"}
      // src={resolvedTheme === "dark" ? "/Brand-dark.svg" : "/Brand-light.svg"}
      alt="Super Portal"
      width={500}
      height={48}
      priority
    />
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Branding */}
      <div className="hidden items-center justify-center border-r-2 bg-black p-10 lg:flex">
        <div className="max-w-md space-y-6 text-center">
          <BrandLogo />
          {/* <h1 className="font-bold text-4xl">Super Portal</h1> */}
          <p className="font-stretch-90% text-muted-foreground">
            Access all internal applications from a single secure platform.
          </p>
        </div>
      </div>

      {/* Right Auth */}
      <div className="flex items-center justify-center p-6">{children}</div>
    </div>
  );
}
