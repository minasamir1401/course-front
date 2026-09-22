import { API_URL } from "./api";

/**
 * Compresses an image file using Canvas.
 * @param file The image file to compress.
 * @param maxWidth Maximum width of the compressed image.
 * @param maxHeight Maximum height of the compressed image.
 * @param quality Compression quality (0 to 1).
 * @returns A promise that resolves to the compressed image as a base64 string.
 */
export async function compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export to base64
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export async function compressImageToFile(
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.type.includes("svg") || file.type.includes("gif")) {
      return resolve(file);
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newName = file.name.replace(/\.[^/.]+$/, ".webp");
              resolve(new File([blob], newName, { type: "image/webp", lastModified: Date.now() }));
            } else {
              resolve(file);
            }
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a file to the server and returns its URL.
 * Supports cookies and optional bearer token, with automatic image compression.
 */
export async function uploadFileToServer(file: File): Promise<string> {
  let fileToUpload = file;
  if (file.type.startsWith("image/") && !file.type.includes("svg") && !file.type.includes("gif")) {
    try {
      fileToUpload = await compressImageToFile(file);
    } catch {
      fileToUpload = file;
    }
  }

  const formData = new FormData();
  formData.append("file", fileToUpload);

  const rawToken =
    typeof window !== "undefined"
      ? localStorage.getItem("super_admin_token") ||
        localStorage.getItem("school_admin_token") ||
        localStorage.getItem("lms_token") ||
        ""
      : "";
  const token = rawToken && rawToken !== "cookie_auth" ? rawToken : "";

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    credentials: "include", // httpOnly auth_token cookie sent automatically
    headers,
    body: formData,
  });

  if (!res.ok) {
    let errorDetails = "Failed to upload file to server";
    try {
      const errData = await res.json();
      errorDetails = errData.details || errData.error || errorDetails;
    } catch {}
    throw new Error(errorDetails);
  }

  const data = await res.json();
  return data.url;
}

/**
 * Extracts all unique image URLs from an HTML string.
 */
export function extractImageUrls(html?: string | null): string[] {
  if (!html) return [];
  const urls: string[] = [];
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const src = match[1]?.trim();
    if (src && !urls.includes(src)) {
      urls.push(src);
    }
  }
  return urls;
}

/**
 * Inserts an image into an HTML string if not already present.
 */
export function insertImageIntoHtml(html: string | undefined | null, imgUrl: string): string {
  const current = String(html || '').trim();
  if (current.includes(imgUrl)) return current;
  const imgTag = `<p><img loading="lazy" decoding="async" src="${imgUrl}" data-align="center" style="max-width: 100%; height: auto; border-radius: 12px; margin: 10px auto; display: block;" /></p>`;
  if (!current || current === '<p><br></p>' || current === '<p></p>') {
    return imgTag;
  }
  return `${imgTag}\n${current}`;
}

/**
 * Removes an image by its URL from an HTML string.
 */
export function removeImageFromHtml(html: string | undefined | null, imgUrl: string): string {
  if (!html) return '';
  const escaped = imgUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const imgRegex = new RegExp(`<p>\\s*<img[^>]+src=["']${escaped}["'][^>]*>\\s*</p>|<img[^>]+src=["']${escaped}["'][^>]*>`, 'gi');
  return html.replace(imgRegex, '').trim();
}
