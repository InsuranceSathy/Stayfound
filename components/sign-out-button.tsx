"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
    setLoading(false);
  }

  return (
    <button className="btn btn-ghost" onClick={handle} disabled={loading}>
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
