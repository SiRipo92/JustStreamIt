from __future__ import annotations
from urllib.parse import urlparse
import requests
from django.http import HttpResponse, StreamingHttpResponse
from django.http.request import HttpRequest
from django.views.decorators.http import require_GET

# Inline SVG placeholder returned when the remote image is missing or invalid.
FALLBACK_SVG: str = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 540">'
    '<rect width="100%" height="100%" fill="#e9ecef"/>'
    '<text x="50%" y="50%" dy="0.35em" text-anchor="middle" '
    'font-family="sans-serif" font-size="20" fill="#6c757d">'
    'Poster indisponible</text></svg>'
)

# Whitelist of allowed upstream image hosts
ALLOWED_HOSTS = {"m.media-amazon.com", "images-na.ssl-images-amazon.com"}

@require_GET
def poster_proxy(request: HttpRequest) -> HttpResponse:
    """
    Serve a proxied poster image or an SVG fallback.

    Behavior:
      - Validates the `url` query param and enforces ALLOWED_HOSTS.
      - Fetches the remote resource with a short timeout and generic UA.
      - Streams the body when HTTP 200 and Content-Type starts with "image/".
      - Falls back to a small inline SVG (HTTP 200) on errors or disallowed hosts.
      - Adds cache (7 days for images) and no-sniff headers.
    """
    remote = request.GET.get("url", "").strip()
    if not remote:
        return HttpResponse(FALLBACK_SVG, content_type="image/svg+xml")

    # Reject malformed URLs and non-whitelisted hosts.
    try:
        host = urlparse(remote).netloc.lower()
    except Exception:
        host = ""
    if host not in ALLOWED_HOSTS:
        return HttpResponse(FALLBACK_SVG, content_type="image/svg+xml")

    try:
        # Stream to avoid buffering large images in memory.
        r = requests.get(
            remote,
            stream=True,
            timeout=6,
            headers={"User-Agent": "Mozilla/5.0", "Referer": ""},
        )

        # Only pass through actual image content.
        if r.status_code == 200 and r.headers.get("Content-Type", "").startswith("image/"):
            resp = StreamingHttpResponse(r.raw, content_type=r.headers.get("Content-Type"))
            resp["Cache-Control"] = "public, max-age=604800"
            return resp
    except requests.RequestException:
        # Network, timeout, DNS, SSL, etc. → fall back to SVG.
        pass

    return HttpResponse(FALLBACK_SVG, content_type="image/svg+xml")
