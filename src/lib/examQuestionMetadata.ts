export const INITIAL_AVAILABLE_METADATA = {
  domains: [] as string[],
  standards: [] as string[],
  indicators: [] as string[],
  outcomes: [] as string[],
  skills: [] as string[],
  subskills: [] as string[],
  microSkills: [] as string[],
  levels: ["Foundation", "On_Level", "Advanced"] as string[],
  doks: ["DOK 1", "DOK 2", "DOK 3", "DOK 4"] as string[],
  cognitives: ["Knowledge", "Application", "Reasoning"] as string[],
  errorPatterns: [] as string[],
};

export const dedupeStrings = (values: any[] = []) =>
  Array.from(
    new Set(
      values
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
    )
  );

export const mergeAvailableMetadata = (current: any, patch: any) => {
  const next: any = { ...(current || {}) };
  const keys = Object.keys(INITIAL_AVAILABLE_METADATA);

  keys.forEach((key) => {
    next[key] = dedupeStrings([
      ...((current && current[key]) || []),
      ...((patch && patch[key]) || []),
    ]);
  });

  return next;
};

export const normalizeDok = (val: any): string => {
  if (val === null || val === undefined) return "";
  const s = String(val).trim();
  if (!s) return "";
  const dokMatch = s.match(/^DOK\s*([1-4])$/i);
  if (dokMatch) return `DOK ${dokMatch[1]}`;

  const numMatch = s.match(/^([1-4])(?:\.0+)?$/);
  if (numMatch) return `DOK ${numMatch[1]}`;

  const wordMatch = s.match(/(?:dok|level|مستوى|عمق|درجة)\s*[:\-]?\s*([1-4])/i);
  if (wordMatch) return `DOK ${wordMatch[1]}`;

  if (/^[1-4]$/.test(s)) return `DOK ${s}`;

  return s;
};

export const collectMetadataFromQuestions = (questions: any[] = []) => ({
  domains: dedupeStrings(questions.map((question) => question?.domain)),
  standards: dedupeStrings(
    questions.map((question) => question?.standard || question?.learningOutcome)
  ),
  indicators: dedupeStrings(questions.map((question) => question?.indicator)),
  outcomes: dedupeStrings(
    questions.map(
      (question) =>
        question?.skill ||
        question?.learningOutcome ||
        question?.standard
    )
  ),
  skills: dedupeStrings(questions.map((question) => question?.skill)),
  subskills: dedupeStrings(questions.map((question) => question?.subskill)),
  microSkills: dedupeStrings(questions.map((question) => question?.microSkill)),
  levels: dedupeStrings([
    ...INITIAL_AVAILABLE_METADATA.levels,
    ...questions.map((question) => question?.level),
  ]),
  doks: dedupeStrings([
    ...INITIAL_AVAILABLE_METADATA.doks,
    ...questions.map((question) => normalizeDok(question?.dok) || question?.dok),
  ]),
  cognitives: dedupeStrings([
    ...INITIAL_AVAILABLE_METADATA.cognitives,
    ...questions.map((question) => question?.cognitive),
  ]),
  errorPatterns: dedupeStrings(
    questions.map((question) => question?.errorPattern)
  ),
});

export const parseEstimatedTime = (value?: string) => {
  const safeValue = String(value || "").trim();
  if (!safeValue) return { minutes: "", seconds: "" };

  const colonMatch = safeValue.match(/^(\d{1,3})\s*:\s*(\d{1,2})$/);
  if (colonMatch) {
    return {
      minutes: colonMatch[1],
      seconds: colonMatch[2].padStart(2, "0"),
    };
  }

  const numericValue = safeValue.replace(/[^\d]/g, "");
  if (!numericValue) return { minutes: "", seconds: "" };

  return { minutes: numericValue, seconds: "00" };
};

export const formatEstimatedTime = (minutes?: string | number, seconds?: string | number) => {
  const normalizedMinutes = String(minutes ?? "").replace(/[^\d]/g, "");
  const normalizedSeconds = String(seconds ?? "").replace(/[^\d]/g, "");

  if (!normalizedMinutes && !normalizedSeconds) return "";

  const safeMinutes = normalizedMinutes || "0";
  const safeSecondsNumber = Math.min(
    59,
    Math.max(0, Number(normalizedSeconds || "0"))
  );

  return `${safeMinutes}:${String(safeSecondsNumber).padStart(2, "0")}`;
};
