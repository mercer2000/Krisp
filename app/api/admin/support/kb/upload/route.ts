import { NextRequest, NextResponse } from "next/server";
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { ingestText, ingestPdfText, ingestCsv, ingestSitemap } from "@/lib/support/kb-ingest";

export async function POST(request: NextRequest) {
  await getRequiredAdmin();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File;
  const type = (formData.get("type") as string) || null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const text = await file.text();
  const fileName = file.name.toLowerCase();

  // Determine the source type from explicit type param or file extension
  let sourceType: "pdf" | "csv" | "sitemap" | "text";
  if (type === "pdf" || (!type && fileName.endsWith(".pdf"))) {
    sourceType = "pdf";
  } else if (type === "csv" || (!type && fileName.endsWith(".csv"))) {
    sourceType = "csv";
  } else if (
    type === "sitemap" ||
    (!type && (fileName.endsWith(".xml") || fileName.includes("sitemap")))
  ) {
    sourceType = "sitemap";
  } else {
    sourceType = "text";
  }

  try {
    // Fire-and-forget: each ingest function creates its own source record
    switch (sourceType) {
      case "pdf":
        ingestPdfText(text, file.name).catch((err) =>
          console.error("PDF ingest error:", err)
        );
        break;
      case "csv":
        ingestCsv(text, file.name).catch((err) =>
          console.error("CSV ingest error:", err)
        );
        break;
      case "sitemap":
        ingestSitemap(text, file.name).catch((err) =>
          console.error("Sitemap ingest error:", err)
        );
        break;
      default:
        ingestText(text, file.name).catch((err) =>
          console.error("Text ingest error:", err)
        );
        break;
    }

    return NextResponse.json({ status: "processing" });
  } catch (error) {
    console.error("File upload ingest error:", error);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}
