export const remainingExamSeconds = (deadline: number, now: number) => Math.max(0, Math.ceil((deadline - now) / 1000));
