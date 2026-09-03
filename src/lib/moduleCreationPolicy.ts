export const canCreateModule = (modules: unknown): boolean =>
  !Array.isArray(modules) || modules.length === 0;
