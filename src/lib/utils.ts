import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Tambahkan helper functions untuk tanggal
export function formatDateForInput(dateString: string | undefined): string {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; // Format YYYY-MM-DD
  } catch {
    return "";
  }
}

export function formatDateForDisplay(dateString: string | undefined): string {
  if (!dateString) return "Hari ini";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Hari ini";
  }
}

export function isToday(dateString: string | undefined): boolean {
  if (!dateString) return true;

  try {
    // ✅ Untuk SSR consistency, return true by default
    if (typeof window === 'undefined') return true;
    
    const inputDate = new Date(dateString);
    const today = new Date();
    return inputDate.toDateString() === today.toDateString();
  } catch {
    return true;
  }
}
