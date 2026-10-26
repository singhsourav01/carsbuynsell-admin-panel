import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(duration);
dayjs.extend(relativeTime);

export function formatCurrency(amount: number): string {
  const value = Math.round(Number(amount) || 0);
  return `₹${value.toLocaleString("en-IN")}`;
}

export function formatCountdown(endDate: string): {
  hours: string;
  minutes: string;
  seconds: string;
  expired: boolean;
} {
  const now = dayjs();
  const end = dayjs(endDate);
  const diff = end.diff(now, "second");

  if (diff <= 0) {
    return { hours: "00", minutes: "00", seconds: "00", expired: true };
  }

  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;

  return {
    hours: String(h).padStart(2, "0"),
    minutes: String(m).padStart(2, "0"),
    seconds: String(s).padStart(2, "0"),
    expired: false,
  };
}

const ENDED_STATUSES = ["ENDED", "CLOSED", "SOLD", "EXPIRED", "COMPLETED"];

export function isAuctionEnded(listing: {
  lst_auction_end?: string | null;
  lst_status?: string | null;
} | null | undefined): boolean {
  if (!listing) return false;

  const status = String(listing.lst_status || "").trim().toUpperCase();
  if (ENDED_STATUSES.includes(status)) return true;

  if (listing.lst_auction_end) {
    const endTime = new Date(listing.lst_auction_end).getTime();
    if (!isNaN(endTime) && endTime <= Date.now()) return true;
  }

  return false;
}

export function formatDate(date: string): string {
  return dayjs(date).format("DD MMM YYYY");
}

export function formatRelativeTime(date: string): string {
  return dayjs(date).fromNow();
}

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}
