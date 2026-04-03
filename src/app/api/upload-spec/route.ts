import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

/**
 * POST /api/upload-spec
 * Server-side handler for Vercel Blob client uploads.
 * The actual file goes directly from the browser to Blob storage,
 * bypassing the 4.5MB serverless body size limit.
 *
 * Requires BLOB_READ_WRITE_TOKEN env var.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["application/pdf", "image/png"],
        maximumSizeInBytes: 20 * 1024 * 1024, // 20MB
      }),
      onUploadCompleted: async () => {
        // Could log or trigger webhooks here if needed
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error("[upload-spec] Failed:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 400 });
  }
}
