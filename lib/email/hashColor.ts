const PALETTE = [
  "#2E5BBA", "#C0392B", "#1A8A5C", "#8E44AD",
  "#D4721A", "#16A085", "#6C3483", "#B33771",
  "#1B6CA8", "#CB6E2D", "#2C8C6E", "#7D3C98",
];

/** Maps a sender name to a consistent color from the palette. */
export function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function initials(name: string): string {
  if (!name) return "?";
  const clean = name.replace(/[<>"]/g, "").trim();
  // Handle "Name <email>" format
  const displayName = clean.includes("<") ? clean.split("<")[0].trim() : clean;
  const parts = displayName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0] ? parts[0].slice(0, 2).toUpperCase() : "?";
}

/** Extract display name from "Name <email>" format. */
export function displayName(sender: string): string {
  const match = sender.match(/^(.+?)\s*<.+>$/);
  if (match) return match[1].replace(/^["']|["']$/g, "").trim();
  return sender.split("@")[0];
}
