export const UNSUPPORTED_HEIC_MESSAGE = 'صور HEIC/HEIF غير مدعومة. حوّل الصورة إلى JPEG أو PNG أو WebP ثم ارفعها. / HEIC/HEIF images are not supported. Convert to JPEG, PNG or WebP before uploading.';

export function isHeicImage(file: Pick<File, 'name' | 'type'>): boolean {
  return /^image\/hei[cf](?:-sequence)?$/i.test(file.type.trim()) || /\.hei[cf]$/i.test(file.name);
}

export function assertSupportedImageUpload(file: Pick<File, 'name' | 'type'>): void {
  if (isHeicImage(file)) throw new Error(UNSUPPORTED_HEIC_MESSAGE);
}
