import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";
config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "AndesTur";

export const uploadBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
      { folder: CLOUDINARY_FOLDER, resource_type: "auto", ...options },
    );
    uploadStream.end(buffer);
  });
};

export const deleteByUrl = async (url) => {
  if (!url || !url.includes("cloudinary")) return;
  const parts = url.split("/");
  const fileWithExt = parts[parts.length - 1];
  const publicId = `${CLOUDINARY_FOLDER}/${fileWithExt.split(".")[0]}`;
  await cloudinary.uploader.destroy(publicId);
};

export default cloudinary;
