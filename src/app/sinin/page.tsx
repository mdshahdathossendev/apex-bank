"use client";

import AuthShell from "@/Component/AuthShell";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function Sinin() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        rememberMe: true,
      });

      if (error) {
        setErrorMessage(error.message || "We couldn't sign you in. Please try again.");
        return;
      }

      if (!data) {
        setErrorMessage("Sign-in succeeded, but no account session was returned. Please try again.");
        return;
      }

      router.replace("/dashboard");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      description="Sign in to securely access your account and manage your money."
      footerHref="/sinup"
      footerLabel="New to Apex Bank?"
      footerLink="Create an account"
      title="Welcome back"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#293532]">
            Email address
          </span>
          <input
            autoComplete="email"
            className="h-11 w-full rounded-xl border border-[#dfe5e2] bg-white px-4 text-sm outline-none transition placeholder:text-[#a2aaa7] hover:border-[#b8c9c2] focus:border-[#377c6d] focus:ring-4 focus:ring-[#377c6d]/10"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#293532]">
            Password
          </span>
          <input
            autoComplete="current-password"
            className="h-11 w-full rounded-xl border border-[#dfe5e2] bg-white px-4 text-sm outline-none transition placeholder:text-[#a2aaa7] hover:border-[#b8c9c2] focus:border-[#377c6d] focus:ring-4 focus:ring-[#377c6d]/10"
            minLength={8}
            name="password"
            placeholder="Enter your password"
            required
            type="password"
          />
        </label>

        {errorMessage && (
          <p
            aria-live="polite"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {errorMessage}
          </p>
        )}

        <button
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#174b41] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#103b33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#377c6d] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
          {!isSubmitting && (
            <svg
              aria-hidden="true"
              className="size-4"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                d="M4.2 10h11.6m-4.7-4.7 4.7 4.7-4.7 4.7"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
