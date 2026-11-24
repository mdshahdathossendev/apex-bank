"use client";

import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import {
  registerCustomer,
  type RegisterCustomerInput,
} from "@/lib/action";

export default function StaffCustomerRegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [registeredCustomer, setRegisteredCustomer] = useState<{
    customerId: string;
    email: string;
  } | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const input: RegisterCustomerInput = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    setIsSubmitting(true);
    setErrorMessage("");
    setRegisteredCustomer(null);
    try {
      const customer = await registerCustomer(input);
      setRegisteredCustomer(customer);
      form.reset();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not register the customer. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-sm font-medium text-blue-700">Staff tools</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Register a customer
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Create a customer sign-in account. The customer can use these details
          to sign in and continue setting up their banking profile.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <label className="block space-y-1.5 text-sm font-medium text-gray-700">
          Customer full name
          <input
            autoComplete="name"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            maxLength={100}
            name="name"
            placeholder="Enter the customer's full name"
            required
            type="text"
          />
        </label>

        <label className="block space-y-1.5 text-sm font-medium text-gray-700">
          Email address
          <input
            autoComplete="email"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            name="email"
            placeholder="customer@example.com"
            required
            type="email"
          />
        </label>

        <label className="block space-y-1.5 text-sm font-medium text-gray-700">
          Initial password
          <input
            autoComplete="new-password"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            minLength={8}
            maxLength={128}
            name="password"
            pattern="(?=.*[A-Z])(?=.*[0-9]).{8,128}"
            placeholder="Create a temporary password"
            required
            title="Use 8 to 128 characters, including one uppercase letter and one number."
            type="password"
          />
          <span className="block text-xs font-normal text-gray-500">
            At least 8 characters, including one uppercase letter and one
            number. Share the sign-in details securely and advise the customer
            to keep the password private.
          </span>
        </label>

        {errorMessage ? (
          <p
            aria-live="polite"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        {registeredCustomer ? (
          <div
            aria-live="polite"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            role="status"
          >
            <p className="font-semibold">Customer account created</p>
            <p className="mt-1">
              {registeredCustomer.email} can now sign in as a customer.
            </p>
          </div>
        ) : null}

        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          disabled={isSubmitting}
          type="submit"
        >
          <UserPlus aria-hidden="true" size={18} />
          {isSubmitting ? "Creating customer..." : "Create customer account"}
        </button>
      </form>
    </div>
  );
}
