"use client";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

function page() {
  return (
    <div>
      page
      <Button onClick={() => signOut({ redirectTo: "/home" })}>Sign Out</Button>
    </div>
  );
}

export default page;
