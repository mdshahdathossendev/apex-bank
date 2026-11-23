"use client";

import AuthShell from "@/Component/AuthShell";
import { authClient } from "@/lib/auth-client";
import { useState, type FormEvent } from "react";

export default function Sinup() {
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (error) {
        setErrorMessage(error.message || "We couldn't create your account. Please try again.");
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      description="Create your account to start banking with more confidence."
      footerHref="/sinin"
      footerLabel="Already have an account?"
      footerLink="Sign in"
      title="Create your account"
    >
      <form className="space-y-3" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#293532]">
            Full name
          </span>
          <input
            autoComplete="name"
            className="h-11 w-full rounded-xl border border-[#dfe5e2] bg-white px-4 text-sm outline-none transition placeholder:text-[#a2aaa7] hover:border-[#b8c9c2] focus:border-[#377c6d] focus:ring-4 focus:ring-[#377c6d]/10"
            name="name"
            placeholder="Your name"
            required
            type="text"
          />
        </label>

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
            autoComplete="new-password"
            className="h-11 w-full rounded-xl border border-[#dfe5e2] bg-white px-4 text-sm outline-none transition placeholder:text-[#a2aaa7] hover:border-[#b8c9c2] focus:border-[#377c6d] focus:ring-4 focus:ring-[#377c6d]/10"
            minLength={8}
            name="password"
            pattern="(?=.*[A-Z])(?=.*[0-9]).{8,}"
            placeholder="Create a strong password"
            required
            title="Use at least 8 characters, including one uppercase letter and one number."
            type="password"
          />
          <span className="mt-2 block text-xs text-[#87918d]">
            At least 8 characters, with one uppercase letter and one number.
          </span>
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
          {isSubmitting ? "Creating account..." : "Create account"}
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
