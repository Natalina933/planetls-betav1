const isAuthDebugEnabled = () => process.env.AUTH_DEBUG_LOGS === "1";

export function logAuthDebug(message: string, payload?: unknown) {
  if (!isAuthDebugEnabled()) return;
  console.info(message, payload);
}

export function logProxyDebug(message: string, payload?: unknown) {
  if (!isAuthDebugEnabled()) return;
  console.info(message, payload);
}
