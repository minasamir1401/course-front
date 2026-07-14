export const parseJson = (str: any, fallback: any = {}) => {
  try {
    if (str === undefined || str === null) return fallback;
    let parsed = str;
    if (typeof str === "string") {
      const trimmed = str.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[") || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
        try {
          parsed = JSON.parse(trimmed);
        } catch (e) {
          // Keep as string if JSON parsing fails
        }
      }
    }
    if (typeof parsed === "string") {
      const trimmed = parsed.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          parsed = JSON.parse(trimmed);
        } catch (e) {
          // Keep as string if JSON parsing fails
        }
      }
    }
    return typeof parsed === "object" && parsed !== null ? parsed : fallback;
  } catch (e) {
    return fallback;
  }
};
