import type { Metadata } from "next";
import PrivacySettingsClient from "./PrivacySettingsClient";

export const metadata: Metadata = {
  title: "Privacy settings | POWR",
  description:
    "Manage POWR analysis consent and optional advertising measurement preferences.",
};

export default function PrivacySettingsPage() {
  return <PrivacySettingsClient />;
}
