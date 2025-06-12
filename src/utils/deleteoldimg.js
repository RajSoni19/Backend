import {v2 as cloudinary} from "cloudinary"

export const deleteFromCloudinary = async (imageUrl) => {
    try {
        if (!imageUrl) return null;
        
        // Extract public ID from URL
        // Example URL: https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/public-id.jpg
        const publicId = imageUrl
            .split('/')
            .pop()
            .split('.')[0];  // Get the filename without extension

        if (!publicId) return null;

        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Image deleted from Cloudinary:", publicId);
        return result;
    } catch (error) {
        console.log("Cloudinary delete error:", error);
        return null;
    }
}

    