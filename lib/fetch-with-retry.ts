export async function fetchWithRetry(
  input: string | URL | Request,
  init: RequestInit,
  { retries = 2, baseDelay = 400 }: { retries?: number; baseDelay?: number } = {}
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(input, init);
      if (response.ok || response.status < 500 || attempt >= retries) {
        return response;
      }
    } catch (error) {
      if (attempt >= retries) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, baseDelay * 2 ** attempt));
  }
}