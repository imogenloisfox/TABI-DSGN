import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

/**
 * POST /api/upload-spec
 * Receives a file (multipart/form-data, field "file"), uploads it to
 * Vercel Blob with public access, and returns { url }.
 *
 * Supports both PDF spec sheets and PNG design preview images.
 * The URL is included as a line item attribute in the Shopify order
 * so the jeweller can access the spec sheet and design preview.
 *
 * Requires BLOB_READ_WRITE_TOKEN env var (Vercel dashboard → Storage → Blob).
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const timestamp = Date.now();
    const isPdf = file.type === "application/pdf";
    const path = isPdf
      ? `specs/spec-${timestamp}.pdf`
      : `previews/design-${timestamp}.png`;

    const result = await put(path, file, {
      access: "public",
      contentType: isPdf ? "application/pdf" : "image/png",
    });

    return NextResponse.json({ url: result.url });
  } catch (err) {
    console.error("[upload-spec] Failed:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
