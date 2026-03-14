import { NextRequest, NextResponse } from "next/server";
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { db } from "@/lib/db";
import { supportKbSources } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { z } from "zod";
import {
  ingestUrl,
  ingestMultiPageCrawl,
  ingestText,
  ingestCsv,
  ingestSitemap,
} from "@/lib/support/kb-ingest";

const postSchema = z.object({
  type: z.enum(["url", "text", "csv", "sitemap"]),
  url: z.string().url().optional(),
  content: z.string().optional(),
  label: z.string().optional(),
  maxDepth: z.number().min(1).max(5).optional().default(2),
  crawlMode: z.enum(["single", "crawl"]).optional().default("single"),
});

export async function GET() {
  await getRequiredAdmin();

  const sources = await db
    .select()
    .from(supportKbSources)
    .orderBy(desc(supportKbSources.createdAt));

  return NextResponse.json({ sources });
}

export async function POST(request: NextRequest) {
  await getRequiredAdmin();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { type, url, content, label, maxDepth, crawlMode } = parsed.data;

  // Each ingest function creates its own source record and returns the source ID.
  // We fire-and-forget so the admin gets an immediate response.
  // We need to return *something* quickly, so we kick off the ingestion and return
  // a status indicator. The admin UI polls for updates.
  try {
    switch (type) {
      case "url": {
        if (!url) {
          return NextResponse.json(
            { error: "url is required for type 'url'" },
            { status: 400 }
          );
        }
        if (crawlMode === "crawl") {
          // Fire-and-forget: don't await the full crawl
          ingestMultiPageCrawl(url, maxDepth, label).catch((err) =>
            console.error("Multi-page crawl error:", err)
          );
        } else {
          ingestUrl(url, label).catch((err) =>
            console.error("URL ingest error:", err)
          );
        }
        return NextResponse.json({ status: "processing" });
      }

      case "text": {
        if (!content) {
          return NextResponse.json(
            { error: "content is required for type 'text'" },
            { status: 400 }
          );
        }
        ingestText(content, label).catch((err) =>
          console.error("Text ingest error:", err)
        );
        return NextResponse.json({ status: "processing" });
      }

      case "csv": {
        if (!content) {
          return NextResponse.json(
            { error: "content is required for type 'csv'" },
            { status: 400 }
          );
        }
        ingestCsv(content, label).catch((err) =>
          console.error("CSV ingest error:", err)
        );
        return NextResponse.json({ status: "processing" });
      }

      case "sitemap": {
        if (!content && !url) {
          return NextResponse.json(
            { error: "content or url is required for type 'sitemap'" },
            { status: 400 }
          );
        }
        if (url && !content) {
          // Fetch sitemap from URL, then ingest
          fetch(url)
            .then((res) => res.text())
            .then((xml) => ingestSitemap(xml, label))
            .catch((err) =>
              console.error("Sitemap fetch+ingest error:", err)
            );
        } else {
          ingestSitemap(content!, label).catch((err) =>
            console.error("Sitemap ingest error:", err)
          );
        }
        return NextResponse.json({ status: "processing" });
      }

      default:
        return NextResponse.json(
          { error: "Unsupported type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("KB ingest error:", error);
    return NextResponse.json(
      { error: "Failed to start ingestion" },
      { status: 500 }
    );
  }
}
