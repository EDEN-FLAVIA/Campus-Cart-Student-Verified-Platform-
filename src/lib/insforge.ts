import { createClient } from "@insforge/sdk";

// Helper to check if a URL is valid
function isValidUrl(url: string | undefined): boolean {
  if (!url) return false;
  // Exclude placeholder templated strings
  if (url.includes("MY_VITE_INSFORGE_URL") || url.startsWith("MY_") || url.includes("<")) return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// Initialize the InsForge backend client with configuration details
const envUrl = (import.meta as any).env.VITE_INSFORGE_URL;
const baseUrl = isValidUrl(envUrl)
  ? envUrl
  : "https://pw4dvxp6.ap-southeast.insforge.app";

const envKey = (import.meta as any).env.VITE_INSFORGE_ANON_KEY;
const anonKey = envKey && envKey !== "MY_VITE_INSFORGE_ANON_KEY" && !envKey.startsWith("MY_")
  ? envKey
  : "ik_5131144d8e1090a30489f9560055d33b";

export const insforge = createClient({
  baseUrl,
  anonKey,
});

