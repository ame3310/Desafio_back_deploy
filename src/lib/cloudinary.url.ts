const CLOUD = process.env.CLOUDINARY_CLOUD_NAME!; 

export function cld(publicId?: string, transform = ""): string | undefined {
  if (!publicId) return undefined;
  const t = transform ? `${transform.replace(/\/$/, "")}/` : "";
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${t}${publicId}`;
}

export const cldThumb = (id?: string) =>
  cld(id, "w_160,h_160,c_thumb,g_center,f_auto,q_auto");

export const cldSmall = (id?: string) => cld(id, "w_400,f_auto,q_auto");

export const cldLarge = (id?: string) => cld(id, "w_1200,f_auto,q_auto");
