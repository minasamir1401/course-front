import DOMPurify from "dompurify";



export const decodeHtmlEntities = (input: string): string => {
  if (!input || typeof input !== 'string') return input || '';
  if (input.includes('&lt;') || input.includes('&gt;')) {
    return input
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&amp;/gi, '&');
  }
  return input;
};

export const sanitizeHtml = (input: string): string => {
  if (!input) return "";

  const decoded = decodeHtmlEntities(String(input));

  // Bounded safe fallback for Next.js Server-Side Rendering (SSR)
  if (typeof window === "undefined") {
    let sanitized = decoded;
    sanitized = sanitized.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
    sanitized = sanitized.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
    sanitized = sanitized.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");
    sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]+/gi, "");
    sanitized = sanitized.replace(/javascript:/gi, "");
    sanitized = sanitized.replace(/data:text\/html/gi, "");
    return sanitized;
  }

  return DOMPurify.sanitize(decoded, {
    ADD_TAGS: ["font", "mark"],
    ADD_ATTR: ["color", "size", "face", "style"]
  });
};
