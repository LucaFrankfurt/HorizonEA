/** Small fetch wrapper for the REST API used by client components. */
export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public issues?: Record<string, string>,
  ) {
    super(message);
  }
}

export async function api<T = unknown>(method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE", url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const issues = data?.issues as Record<string, string> | undefined;
    const detail = issues ? Object.values(issues)[0] : undefined;
    throw new RequestError(data?.error && detail ? `${data.error}: ${detail}` : (data?.error ?? `Request failed (${res.status})`), res.status, issues);
  }
  return data as T;
}
