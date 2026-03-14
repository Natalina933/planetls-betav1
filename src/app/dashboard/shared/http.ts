export async function fetchJsonOrThrow<T>(input: RequestInfo | URL, fallbackError: string) {
  const response = await fetch(input, { cache: "no-store" });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      payload && typeof payload.error === "string" && payload.error.trim()
        ? payload.error
        : fallbackError,
    );
  }

  return payload as T;
}

export async function fetchJsonOrFallback<T>(input: RequestInfo | URL, fallbackValue: T) {
  try {
    const response = await fetch(input, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) return fallbackValue;
    return payload as T;
  } catch {
    return fallbackValue;
  }
}
