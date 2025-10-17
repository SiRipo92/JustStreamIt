from __future__ import annotations
import json
import re
from urllib.parse import urlparse
from typing import Optional
import requests
from bs4 import BeautifulSoup
from django.core.cache import cache
from django.http import HttpResponse, StreamingHttpResponse, HttpResponseBase
from django.http.request import HttpRequest
from django.views.decorators.http import require_GET

FALLBACK_SVG: str = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 540">'
    '<rect width="100%" height="100%" fill="#e9ecef"/>'
    '<text x="50%" y="50%" dy="0.35em" text-anchor="middle" '
    'font-family="sans-serif" font-size="20" fill="#6c757d">'
    'Poster indisponible</text></svg>'
)

# Images we allow the proxy to fetch directly
ALLOWED_IMAGE_HOSTS = {
    "m.media-amazon.com",
    "images-na.ssl-images-amazon.com",
    "ia.media-imdb.com",  # legacy IMDB CDN
}

# IMDB pages we allow scraping for poster fallback
ALLOWED_IMDB_HOSTS = {"www.imdb.com", "imdb.com"}

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
)


def _netloc(url: str) -> str:
    """
    Extract and return the network location (domain name or host) from a URL.

    Example:
        _netloc("https://m.media-amazon.com/images/file.jpg")
        → "m.media-amazon.com"

    Used to:
        - Validate whether the remote image or IMDB page belongs to an allowed host.
        - Prevent proxying requests to unauthorized or unsafe external domains.
    """
    if not url:
        return ""
    # urlparse() does not raise on garbage; no try/except needed.
    return urlparse(url).netloc.lower()


def _pick_largest_from_srcset(srcset: str) -> Optional[str]:
    """Return the URL with the largest declared width from a srcset string."""
    best_url, best_w = None, -1
    for part in srcset.split(","):
        token = part.strip()
        if not token:
            continue
        pieces = token.split()
        if not pieces:
            continue
        url = pieces[0]
        width = 0
        if len(pieces) > 1 and pieces[1].endswith("w"):
            try:
                width = int(pieces[1][:-1])
            except ValueError:
                width = 0
        if width >= best_w:
            best_url, best_w = url, width
    return best_url


def _stream_image(url: str, referer: Optional[str] = None) -> Optional[HttpResponseBase]:
    """Fetch and stream an image if allowed and valid; otherwise None."""
    if _netloc(url) not in ALLOWED_IMAGE_HOSTS:
        return None
    headers = {
        "User-Agent": USER_AGENT,
        # IMDB/Amazon CDN frequently requires a Referer
        "Referer": referer or "https://www.imdb.com/",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    }
    try:
        r = requests.get(url, stream=True, timeout=6, headers=headers)
        if r.status_code == 200 and r.headers.get("Content-Type", "").startswith("image/"):
            resp = StreamingHttpResponse(r.raw, content_type=r.headers.get("Content-Type"))
            resp["Cache-Control"] = "public, max-age=604800"  # 7 days
            return resp
    except requests.RequestException:
        return None
    return None


def _extract_poster_from_imdb_html(html: str) -> Optional[str]:
    """Heuristics to extract a poster URL from IMDB HTML."""
    # 1) OpenGraph (secure or not)
    m = re.search(
        r'<meta[^>]+property=["\']og:image(?:[:\-]secure_url)?["\'][^>]+content=["\']([^"\']+)["\']',
        html,
        flags=re.IGNORECASE,
    )
    if m:
        return m.group(1)

    soup = BeautifulSoup(html, "html.parser")

    # 2) Poster image element(s)
    img = soup.select_one(".ipc-poster__poster-image img, .ipc-image, img[alt][src], img[alt][srcset]")
    if img:
        srcset = img.get("srcset")
        if srcset:
            best = _pick_largest_from_srcset(srcset)
            if best:
                return best
        if img.get("src"):
            return img["src"]

    # 3) JSON-LD
    for node in soup.select('script[type="application/ld+json"]'):
        try:
            data = json.loads(node.string or "{}")
        except (json.JSONDecodeError, TypeError, ValueError):
            continue

        def _take_image(x):
            if isinstance(x, str):
                return x
            if isinstance(x, list) and x:
                return x[0]
            return None

        if isinstance(data, dict):
            cand = _take_image(data.get("image"))
            if cand:
                return cand
        elif isinstance(data, list):
            for item in data:
                if not isinstance(item, dict):
                    continue
                cand = _take_image(item.get("image"))
                if cand:
                    return cand

    return None


def _discover_poster_from_imdb(imdb_url: str) -> Optional[str]:
    """Download the IMDB page (if allowed) and extract a poster URL."""
    if _netloc(imdb_url) not in ALLOWED_IMDB_HOSTS:
        return None

    cache_key = f"poster:imdb:{imdb_url}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    try:
        r = requests.get(
            imdb_url,
            timeout=6,
            headers={"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9"},
        )
        if r.status_code == 200 and r.text:
            poster = _extract_poster_from_imdb_html(r.text)
            if poster:
                cache.set(cache_key, poster, 86400)  # 1 day
                return poster
    except requests.RequestException:
        return None

    return None


@require_GET
def poster_proxy(request: HttpRequest) -> HttpResponseBase:
    """
    Query params:
      - url: original image_url from the API
      - imdb: (optional) imdb_url to scrape as a fallback if `url` fails
    """
    img_url = (request.GET.get("url") or "").strip()
    imdb_url = (request.GET.get("imdb") or "").strip()
    referer = imdb_url or "https://www.imdb.com/"

    # 1) Try the original image_url directly (with referer)
    if img_url:
        streamed = _stream_image(img_url, referer=referer)
        if streamed:
            return streamed

    # 2) Discover from IMDB if needed
    if imdb_url:
        discovered = _discover_poster_from_imdb(imdb_url)
        if discovered:
            streamed = _stream_image(discovered, referer=referer)
            if streamed:
                return streamed

    # 3) Fallback SVG
    return HttpResponse(FALLBACK_SVG, content_type="image/svg+xml")
