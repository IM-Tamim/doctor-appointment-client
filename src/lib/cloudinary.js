/**
 * Adds Cloudinary's automatic format + quality transformation (`f_auto,q_auto`)
 * to delivery URLs, so the CDN serves WebP/AVIF at a sensible quality instead
 * of the original upload. Non-Cloudinary URLs and URLs that already carry a
 * transformation are returned untouched.
 */
export const cld = (url) => {
  if (typeof url !== "string" || !url.includes("res.cloudinary.com")) return url;
  const marker = "/upload/";
  const at = url.indexOf(marker);
  if (at === -1) return url;
  const rest = url.slice(at + marker.length);
  if (/^(f_|q_|w_|h_|c_|t_)/.test(rest)) return url;
  return `${url.slice(0, at + marker.length)}f_auto,q_auto/${rest}`;
};
