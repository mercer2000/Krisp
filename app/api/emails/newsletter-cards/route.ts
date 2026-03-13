import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getEmailDetail } from "@/lib/email/emails";
import { getGmailEmailById } from "@/lib/gmail/emails";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Minimum image dimensions to be considered a hero image (pixels in attribute or style). */
const MIN_HERO_WIDTH = 200;
const MIN_HERO_HEIGHT = 100;

/** Common tracking/pixel/icon domains to skip. */
const SKIP_DOMAINS = [
  "open.convertkit-",
  "trk.",
  "track.",
  "pixel.",
  "beacon.",
  "t.co/",
  "click.",
  "email.",
  "/track/",
  "/open/",
  "/pixel",
  "spacer.gif",
  "blank.gif",
  "transparent.gif",
  "1x1",
];

function isTrackingImage(src: string): boolean {
  const lower = src.toLowerCase();
  return SKIP_DOMAINS.some((d) => lower.includes(d));
}

/** Extract numeric dimension from attribute string (e.g. "600" or "600px"). */
function parseDim(val: string | undefined): number {
  if (!val) return 0;
  const n = parseInt(val.replace(/px/i, ""), 10);
  return isNaN(n) ? 0 : n;
}

interface ExtractedCard {
  emailId: string | number;
  heroImage: string | null;
  links: { text: string; url: string }[];
  senderName: string;
  senderDomain: string;
}

function extractSenderDomain(sender: string): string {
  const match = sender.match(/@([^>\s]+)/);
  return match ? match[1].toLowerCase() : "";
}

function extractSenderName(sender: string): string {
  // "Name <email>" → "Name", otherwise the email itself
  const match = sender.match(/^(.+?)\s*<.+>$/);
  return match ? match[1].replace(/^["']|["']$/g, "").trim() : sender.split("@")[0];
}

/**
 * Parse newsletter HTML and extract a hero image URL and quick links.
 * Uses regex-based extraction to avoid heavy DOM dependencies on the server.
 */
function extractCardData(
  html: string,
  sender: string,
  emailId: string | number
): ExtractedCard {
  const senderName = extractSenderName(sender);
  const senderDomain = extractSenderDomain(sender);

  // --- Extract images ---
  const imgRegex = /<img\s+[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let heroImage: string | null = null;
  let match: RegExpExecArray | null;

  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (!src || isTrackingImage(src)) continue;
    // Skip tiny images (tracking pixels, icons)
    const tag = match[0];
    const widthMatch = tag.match(/width\s*=\s*["']?(\d+)/i);
    const heightMatch = tag.match(/height\s*=\s*["']?(\d+)/i);
    const w = parseDim(widthMatch?.[1]);
    const h = parseDim(heightMatch?.[1]);

    // If dimensions are specified and too small, skip
    if (w > 0 && w < MIN_HERO_WIDTH) continue;
    if (h > 0 && h < MIN_HERO_HEIGHT) continue;
    // If both dimensions are 1 (tracking pixel), skip
    if (w === 1 && h === 1) continue;

    // Skip common icon/logo patterns (very small or logo in path)
    const lowerSrc = src.toLowerCase();
    if (
      lowerSrc.includes("/icon") ||
      lowerSrc.includes("favicon") ||
      lowerSrc.includes("logo") && (w > 0 && w < 100)
    ) {
      continue;
    }

    // First qualifying image is the hero
    heroImage = src;
    break;
  }

  // --- Extract links ---
  const linkRegex = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const links: { text: string; url: string }[] = [];
  const seenUrls = new Set<string>();

  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    const rawText = match[2];
    if (!url || url.startsWith("mailto:") || url.startsWith("#")) continue;

    // Strip HTML tags from link text
    const text = rawText.replace(/<[^>]+>/g, "").trim();
    if (!text || text.length < 3 || text.length > 100) continue;

    // Skip common non-content links
    const lowerText = text.toLowerCase();
    if (
      lowerText === "unsubscribe" ||
      lowerText === "view in browser" ||
      lowerText === "view online" ||
      lowerText === "update preferences" ||
      lowerText === "manage preferences" ||
      lowerText.includes("privacy policy") ||
      lowerText.includes("terms of") ||
      lowerText === "here"
    ) {
      continue;
    }

    // Deduplicate by URL
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);

    links.push({ text, url });
    if (links.length >= 5) break; // Cap at 5 quick links
  }

  return { emailId, heroImage, links, senderName, senderDomain };
}

export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const emailIds: (string | number)[] = body.emailIds;
    if (!Array.isArray(emailIds) || emailIds.length === 0) {
      return NextResponse.json({ error: "emailIds required" }, { status: 400 });
    }

    // Cap at 20 to avoid overloading
    const ids = emailIds.slice(0, 20);

    const cards: ExtractedCard[] = [];

    await Promise.all(
      ids.map(async (id) => {
        try {
          let html: string | null = null;
          let sender = "";

          if (UUID_REGEX.test(String(id))) {
            // Gmail
            const email = await getGmailEmailById(String(id), userId);
            if (email) {
              html = email.body_html;
              sender = email.sender;
            }
          } else {
            // Outlook
            const email = await getEmailDetail(Number(id), userId);
            if (email) {
              html = email.body_html;
              sender = email.sender;
            }
          }

          if (html) {
            cards.push(extractCardData(html, sender, id));
          }
        } catch {
          // Skip individual failures
        }
      })
    );

    return NextResponse.json({ data: cards });
  } catch {
    return NextResponse.json(
      { error: "Failed to extract newsletter cards" },
      { status: 500 }
    );
  }
}
