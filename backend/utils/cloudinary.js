import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export const isCloudinaryConfigured = () => Boolean(cloudName && apiKey && apiSecret);

export const uploadCourseThumbnail = async (fileBuffer, fileName = 'course-thumbnail') => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }

  const base64Image = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(base64Image, {
    folder: 'greenunimind/courses',
    resource_type: 'image',
    public_id: `${Date.now()}-${Math.random().toString(36).slice(2)}-${fileName}`,
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

export const deleteCourseThumbnail = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (error) {
    // Ignore cleanup failures to avoid breaking primary flows.
    console.error('Failed to delete old Cloudinary thumbnail:', error.message);
  }
};
