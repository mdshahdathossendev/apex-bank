"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setErrorMessage("");

    try {
      const { error } = await authClient.signOut();

      if (error) {
        setErrorMessage(error.message || "Unable to log out. Please try again.");
        return;
      }

      router.replace("/sinin");
      router.refresh();
    } catch {
      setErrorMessage("Unable to log out. Please check your connection and try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div>
      <button
        aria-busy={isSigningOut}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSigningOut}
        onClick={handleSignOut}
        type="button"
      >
        <LogOut size={19} />
        {isSigningOut ? "Logging out..." : "Logout"}
      </button>
      {errorMessage && (
        <p aria-live="polite" className="px-3 pt-2 text-xs text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
