import cloudinaryPkg from "cloudinary";

const { v2: cloudinary } = cloudinaryPkg;

export function configureCloudinary() {
  if (!process.env.CLOUDINARY_URL) {
    throw new Error("CLOUDINARY_URL is not set");
  }
  cloudinary.config({ secure: true });
}

export { cloudinary };
