const LARGE_PASTE_TEXT_THRESHOLD = 8000;
const LARGE_PASTE_HTML_THRESHOLD = 12000;

export function shouldPreferPlainTextPaste(html: string, plainText: string): boolean {
  if (!plainText) return false;

  const normalizedHtml = html.trim();
  if (!normalizedHtml) return plainText.length > LARGE_PASTE_TEXT_THRESHOLD;

  return (
    plainText.length >= LARGE_PASTE_TEXT_THRESHOLD ||
    normalizedHtml.length >= LARGE_PASTE_HTML_THRESHOLD
  );
}

export function convertPlainTextToHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "<br>");
}
