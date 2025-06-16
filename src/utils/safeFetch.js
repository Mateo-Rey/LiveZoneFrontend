export async function safeJsonFetch(url, options = {}) {
  const response = await fetch(url, options);

  const contentType = response.headers.get("content-type");
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
  }
  if (contentType && contentType.includes("application/json")) {
    return response.json()
  }
  return null; // no JSON body
}