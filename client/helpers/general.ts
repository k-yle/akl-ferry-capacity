export const repairError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(`${error}`);
