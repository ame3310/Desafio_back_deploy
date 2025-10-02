import { ERR } from "@shared/constants/error.constants";
import { ApiError } from "@shared/errors/apiError";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
} else if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn("[Cloudinary] Sin configuración. No se subirán imágenes.");
}

export async function uploadBufferToCloudinary(params: {
  buffer: Buffer;
  folder: string;
  publicId?: string;
}): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: params.folder,
        public_id: params.publicId,
        overwrite: false,
        unique_filename: true,
        resource_type: "image",
      },
      (err, result) => {
        if (err) return reject(err);
        if (!result)
          return reject(
            ApiError.badRequest(
              "Cloudinary result vacío",
              ERR.CLOUDINARY.CLOUDINARY_NO_RESULT
            )
          );
        resolve(result);
      }
    );
    stream.end(params.buffer);
  });
}

export const cloudinaryConfigured =
  Boolean(process.env.CLOUDINARY_URL) ||
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
