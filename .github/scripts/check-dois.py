"""Check DOI registration at the resolver without visiting publisher websites."""

from pathlib import Path
import re
import subprocess
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote, unquote, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener


class DOIError(RuntimeError):
    pass


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *_args):
        return None


def normalize_doi(value):
    value = value.strip().strip("\"'")
    if value.lower().startswith(("http://", "https://")):
        url = urlsplit(value)
        if url.hostname in {"doi.org", "dx.doi.org"}:
            return unquote(url.path.lstrip("/"))
    return value


def extract_dois(text):
    values = set()
    for fields in re.findall(r'(?im)^[ \t]*doi[ \t]*=[ \t]*(?:\{([^}]*)\}|"([^"]*)"|([^,\r\n]*))', text):
        values.add(normalize_doi(next((value for value in fields if value), "")))
    for value in re.findall(r"(?im)^[ \t]*citation_doi[ \t]*:[ \t]*([^\r\n]*)", text):
        values.add(normalize_doi(re.sub(r"\s+#.*$", "", value)))
    for value in re.findall(r"https?://(?:dx\.)?doi\.org/[^\s<>\"'{}]+", text, flags=re.I):
        # Preserve parentheses inside DOI suffixes, but stop at a Markdown link's closing parenthesis.
        depth = 0
        for index, char in enumerate(value):
            if char == "(":
                depth += 1
            elif char == ")":
                if depth == 0:
                    value = value[:index]
                    break
                depth -= 1
        values.add(normalize_doi(value.rstrip(".,;")))
    return values


def is_source(path):
    if path.as_posix() in {"README.md", "_pages/404.md"} or path.parts[0] in {"_site", "lighthouse_results"}:
        return False
    return path.suffix in {".md", ".html", ".bib"} or (path.parts[0] == "_data" and path.suffix == ".yml")


def check_doi(doi, *, resolver="https://doi.org/", attempts=3, timeout=15):
    if not re.fullmatch(r"10\.\d{4,9}/\S+", doi):
        raise DOIError(f"Invalid DOI syntax: {doi!r}")
    request = Request(resolver + quote(doi, safe="/"), headers={"User-Agent": "website-doi-link-check/1.0"})
    opener = build_opener(NoRedirect())
    for attempt in range(attempts):
        try:
            try:
                with opener.open(request, timeout=timeout) as response:
                    status, location = response.status, response.headers.get("Location", "")
            except HTTPError as error:
                status, location = error.code, error.headers.get("Location", "")
                error.close()
        except (URLError, OSError) as error:
            failure = f"Resolver network error: {error}"
        else:
            if status in {301, 302, 303, 307, 308}:
                target = urlsplit(location)
                if target.scheme in {"http", "https"} and target.hostname and target.hostname not in {"doi.org", "dx.doi.org"}:
                    return status, location
                raise DOIError(f"HTTP {status} without an external HTTP(S) Location")
            failure = f"Resolver returned HTTP {status} instead of a registered DOI redirect"
            if status not in {408, 429} and status < 500:
                raise DOIError(failure)
        if attempt + 1 < attempts:
            time.sleep(2**attempt)
    raise DOIError(f"{failure} (after {attempts} attempts)")


def main():
    root = Path(__file__).resolve().parents[2]
    files = subprocess.check_output(["git", "ls-files", "-z"], cwd=root).decode().split("\0")
    dois = {}
    for name in files:
        if name and is_source(Path(name)):
            for doi in extract_dois((root / name).read_text()):
                # DOI names are case insensitive; retain the source spelling in logs.
                entry = dois.setdefault(doi.casefold(), {"doi": doi, "sources": []})
                entry["sources"].append(name)
    failures = 0
    for entry in sorted(dois.values(), key=lambda item: item["doi"]):
        doi = entry["doi"]
        try:
            status, target = check_doi(doi)
            print(f"[OK] {doi} -> {target} (HTTP {status}; publisher not requested)", flush=True)
        except (DOIError, ValueError) as error:
            failures += 1
            print(f"[FAIL] {doi}: {error}; sources: {', '.join(entry['sources'])}", flush=True)
    print(f"Checked {len(dois)} unique DOIs: {len(dois) - failures} valid, {failures} failed.")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
