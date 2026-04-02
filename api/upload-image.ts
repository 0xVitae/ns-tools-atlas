import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = { api: { bodyParser: { sizeLimit: "8mb" } } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request: req as any,
      onBeforeGenerateToken: async (pathname) => {
        // Validate file type and path
        const ext = pathname.split(".").pop()?.toLowerCase();
        const allowed = ["webp", "jpg", "jpeg", "png", "gif"];
        if (!ext || !allowed.includes(ext)) {
          throw new Error("Invalid file type. Allowed: " + allowed.join(", "));
        }

        return {
          allowedContentTypes: [
            "image/webp",
            "image/jpeg",
            "image/png",
            "image/gif",
          ],
          maximumSizeInBytes: 5 * 1024 * 1024, // 5MB max after optimization
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async () => {
        // No post-processing needed
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Upload failed" });
  }
}
