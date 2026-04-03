import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

/**
 * POST /api/upload-spec
 * Receives a PDF blob (multipart/form-data, field "file"), uploads it to
 * Vercel Blob with public access, and returns { url }.
 *
 * The URL is included as a _spec_pdf line item attribute in the Shopify order
 * so the jeweller can download the spec sheet directly from the admin order view.
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
    const result = await put(`specs/spec-${timestamp}.pdf`, file, {
      access: "public",
      contentType: "application/pdf",
    });

    return NextResponse.json({ url: result.url });
  } catch (err) {
    console.error("[upload-spec] Failed:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
