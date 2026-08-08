"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { resetAnalytics } from "@/lib/analytics";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          // Drop the identity, or whoever signs in next on this browser is
          // merged into the account that just left.
          resetAnalytics();
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
