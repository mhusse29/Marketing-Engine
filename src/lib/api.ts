/**
 * Get the API base URL from environment variables
 * @returns The API base URL
 */
export function getApiBase(): string {
  return ((import.meta.env?.VITE_API_BASE as string | undefined) ?? 'http://localhost:8787').replace(/\/$/, '')
}
