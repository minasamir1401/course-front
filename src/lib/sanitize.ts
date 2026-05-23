import DOMPurify from "dompurify";

export const sanitizeHtml = (input: string): string => {
  if (!input) return "";

  // Bounded safe fallback for Next.js Server-Side Rendering (SSR)
  if (typeof window === "undefined") {
    let sanitized = input;
    sanitized = sanitized.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
    sanitized = sanitized.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
    sanitized = sanitized.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");
    sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]+/gi, "");
    sanitized = sanitized.replace(/javascript:/gi, "");
    sanitized = sanitized.replace(/data:text\/html/gi, "");
    return sanitized;
  }

  return DOMPurify.sanitize(input);
};
