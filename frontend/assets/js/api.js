const API_BASE = "http://localhost:8000/api/v1";

// Generic JSON fetch with basic error handling
async function getJSON(url, { signal } = {}) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
    credentials: "omit",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} – ${txt.slice(0, 200)}`);
  }
  return res.json();
}

// Helper to resolve detail URL for a list item (API provides `url`)
function detailUrlFromItem(item) {
  if (item?.url && item.url.startsWith("http")) return item.url;
  if (item?.id != null) return `${API_BASE}/titles/${item.id}/`;
  throw new Error("Cannot resolve detail URL");
}

// 1) get top-1 list item  2) fetch its detail  3) return both
export async function fetchBestMovie({ signal } = {}) {
  const listUrl = `${API_BASE}/titles/?sort_by=-imdb_score,-votes&page_size=1`;
  const data = await getJSON(listUrl, { signal });

  const summary = Array.isArray(data?.results) ? data.results[0] : data?.[0];
  if (!summary) throw new Error("No movie found.");

  let detailUrl = detailUrlFromItem(summary);
  // Ensure JSON (your API already honors Accept header, this is extra-safe)
  if (!detailUrl.includes("?")) detailUrl += "?format=json";

  const detail = await getJSON(detailUrl, { signal });
  return { summary, detail };
}