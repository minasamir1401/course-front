import { API_URL, apiFetch } from "./api";

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
  const res = await apiFetch(`${API_URL}/student/stats`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('تعذر تحميل محتوى الطالب. أعد المحاولة.');
  const data = await res.json();
  writeCachedStudentStats(data);
  return data;
};
