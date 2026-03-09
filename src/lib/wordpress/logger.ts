type WordPressLogContext = {
  status?: number;
  endpoint?: string;
};

export function logWordPressError(operation: string, error: unknown, context: WordPressLogContext = {}) {
  const message = error instanceof Error ? error.message : "Unknown error";
  const statusInfo = context.status ? ` status=${context.status}` : "";
  const endpointInfo = context.endpoint ? ` endpoint=${context.endpoint}` : "";
  console.error(`[wordpress] ${operation} failed.${statusInfo}${endpointInfo} message="${message}"`);
}
