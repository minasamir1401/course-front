// Safely parse JSON
export const parseJson = (str: any, fallback: any = {}) => {
  try {
    if (str === undefined || str === null) return fallback;
    let parsed = str;
    if (typeof str === "string") {
      const trimmed = str.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        parsed = JSON.parse(trimmed);
      } else {
        return fallback;
      }
    }
    if (typeof parsed !== "object" || parsed === null) {
      return fallback;
    }
    if (fallback && !Array.isArray(fallback) && Array.isArray(parsed)) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
};

// Bilingual translation helper
export const translateText = (val: any, lang: string): string => {
  if (!val) return "";
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === "object") {
        return parsed[lang] || parsed["ar"] || parsed["en"] || "";
      }
    } catch {}
    return val;
  }
  if (typeof val === "object" && val !== null) {
    return val[lang] || val["ar"] || val["en"] || "";
  }
  return String(val);
};
