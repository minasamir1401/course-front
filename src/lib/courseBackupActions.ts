import { API_URL, apiFetch } from "@/lib/api";

export async function downloadCourseBackupFile(
  courseId: string,
  format: "excel" | "json",
  tokenKey: string,
  courseTitle?: string,
  language: string = "ar",
) {
  const token = localStorage.getItem(tokenKey);
  const lang = language === "en" ? "en" : "ar";
  const endpoint =
    format === "excel"
      ? `${API_URL}/school/export/course/${courseId}?lang=${lang}`
      : `${API_URL}/school/export/json/course/${courseId}`;

  const res = await apiFetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to export course backup");
  }

  const blob = await res.blob();
  const safeName =
    String(courseTitle || `course_${courseId}`)
      .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, "_")
      .slice(0, 40) || `course_${courseId}`;
  const ext = format === "excel" ? "xlsx" : "json";

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeName}_backup.${ext}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export async function restoreCourseFromJsonFile(file: File, tokenKey: string) {
  const token = localStorage.getItem(tokenKey);
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiFetch(`${API_URL}/school/import/json/course`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to restore course JSON");
  }
  return data;
}
