"use client";

import { useState } from "react";
import { CHECKOUT_PREVIEW_PATH, beginCheckout } from "../lib/checkout";

type Props = {
  source: string;
  className?: string;
  children: React.ReactNode;
};

export default function CheckoutButton({ source, className, children }: Props) {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (loading) return;

    beginCheckout(source);
    setLoading(true);

    try {
      const response = await fetch("/api/recruit/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source }),
      });

      if (!response.ok) {
        throw new Error(`Checkout failed: ${response.status}`);
      }

      const data = (await response.json()) as { url?: string };
      window.location.assign(data.url || CHECKOUT_PREVIEW_PATH);
    } catch (error) {
      console.error("Recruit checkout failed, using preview fallback", error);
      window.location.assign(CHECKOUT_PREVIEW_PATH);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => void onClick()}
      disabled={loading}
      aria-busy={loading}
    >
      {loading ? "Opening checkout..." : children}
    </button>
  );
}
