#!/usr/bin/env python3
"""Bundle the whole site into ONE self-contained HTML file.

Inlines the stylesheet, the script, every image (as data URIs) and the three
browser games (as base64; "Play in browser" opens them in a new tab from a
Blob URL). Only Google Fonts and itch.io are still loaded from the web.

Usage:  python3 tools/build_single_file.py [output.html]
Default output: dist/anyware.html
"""
import base64
import mimetypes
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist" / "anyware.html"

mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/svg+xml", ".svg")


def data_uri(rel):
    path = ROOT / rel
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"


html = (ROOT / "index.html").read_text(encoding="utf-8")

# Social preview needs a real URL, not a data URI; drop it in the bundle.
html = re.sub(r'\s*<meta property="og:image"[^>]*>', "", html)

css = (ROOT / "assets/css/style.css").read_text(encoding="utf-8")
html = html.replace(
    '<link rel="stylesheet" href="assets/css/style.css" />', f"<style>\n{css}</style>"
)

js = (ROOT / "assets/js/main.js").read_text(encoding="utf-8")
html = html.replace(
    '<script src="assets/js/main.js" defer></script>', f"<script>\n{js}</script>"
)

html = re.sub(r"assets/img/[\w.-]+", lambda m: data_uri(m.group(0)), html)

games = sorted(set(re.findall(r'href="games/([\w-]+)\.html"', html)))
payload = []
for slug in games:
    b64 = base64.b64encode((ROOT / "games" / f"{slug}.html").read_bytes()).decode()
    payload.append(f'<script type="application/octet-stream" id="game-{slug}">{b64}</script>')

launcher = """<script>
/* Bundled build: open the embedded games in a new tab. */
(function () {
  var urls = {};
  function gameUrl(slug) {
    if (urls[slug]) return urls[slug];
    var el = document.getElementById("game-" + slug);
    if (!el) return null;
    var bin = atob(el.textContent.trim());
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    urls[slug] = URL.createObjectURL(new Blob([bytes], { type: "text/html" }));
    return urls[slug];
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="games/"]');
    if (!a) return;
    var m = a.getAttribute("href").match(/^games\\/([\\w-]+)\\.html$/);
    var url = m && gameUrl(m[1]);
    if (!url) return;
    e.preventDefault();
    window.open(url, "_blank");
  });
})();
</script>"""

html = html.replace("</body>", "\n".join(payload) + "\n" + launcher + "\n</body>")

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(html, encoding="utf-8")
print(f"Wrote {OUT} ({OUT.stat().st_size / 1024 / 1024:.2f} MB, games: {', '.join(games)})")
