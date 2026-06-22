export const extractPublicId = (url: string): string | undefined => {
  if (!url.includes("res.cloudinary.com")) return undefined;

  const parts = url.split("/");
  const uploadIndex = parts.findIndex((part) => part === "upload");
  if (uploadIndex === -1) return undefined;

  const publicIdWithExtension = parts.slice(uploadIndex + 2).join("/");
  return publicIdWithExtension.split(".")[0];
};