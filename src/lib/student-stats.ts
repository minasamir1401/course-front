import { API_URL } from "./api";

type CacheRecord = {
  userKey: string;
  timestamp: number;
  data: any;
};

const CACHE_KEY = "student_stats_cache_v1";
const CACHE_TTL_MS = 60_000; // 60s

const getUserKey = () => {
  try {
    const rawUser = localStorage.getItem("lms_user");
    const parsed = rawUser ? JSON.parse(rawUser) : null;
    return parsed?.id || parsed?.username || "unknown";
  } catch {
    return "unknown";
  }
};

export const readCachedStudentStats = (): any | null => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw) as CacheRecord;
    if (!record?.timestamp || !record?.data) return null;
    if (record.userKey !== getUserKey()) return null;
    if (Date.now() - record.timestamp > CACHE_TTL_MS) return null;
    return record.data;
  } catch {
    return null;
  }
};

export const writeCachedStudentStats = (data: any) => {
  try {
    const record: CacheRecord = { userKey: getUserKey(), timestamp: Date.now(), data };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(record));
  } catch {
    // ignore cache write errors
  }
};

export const fetchStudentStats = async (token: string): Promise<any> => {
  const cached = readCachedStudentStats();

  try {
    const res = await fetch(`${API_URL}/student/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      if (cached) return cached;
      const message = await res.text().catch(() => "");
      console.warn("Could not fetch fresh student stats, using fallback:", res.status, message);
      return { totalXP: 0, completedCourses: 0, passedExams: 0, courseProgresses: [], recentActivities: [] };
    }
    const data = await res.json();
    writeCachedStudentStats(data);
    return data;
  } catch (err: any) {
    if (cached) return cached;
    console.warn("fetchStudentStats failed, returning fallback stats:", err?.message || err);
    return { totalXP: 0, completedCourses: 0, passedExams: 0, courseProgresses: [], recentActivities: [] };
  }
};

