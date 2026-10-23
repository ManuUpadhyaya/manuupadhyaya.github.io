#!/usr/bin/env python3
"""Serve a private Lighthouse preview with production-like gzip transfers."""

import argparse
import gzip
import io
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit


def accepts_gzip(header):
    qualities = {}
    for item in header.split(","):
        encoding, *parameters = item.strip().lower().split(";")
        quality = 1.0
        for parameter in parameters:
            name, _, value = parameter.strip().partition("=")
            if name == "q":
                try:
                    quality = float(value)
                except ValueError:
                    quality = 0.0
        qualities[encoding] = quality
    return qualities.get("gzip", qualities.get("*", 0)) > 0


class PreviewHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".mjs": "text/javascript"}
    gzip_extensions = {".html", ".css", ".js", ".mjs", ".json", ".svg"}

    def send_head(self):
        root = Path(self.directory).resolve()
        path = Path(self.translate_path(self.path)).resolve()
        if not path.is_relative_to(root):
            self.send_error(403)
            return None
        if path.is_dir():
            parts = urlsplit(self.path)
            if not parts.path.endswith("/"):
                self.send_response(301)
                self.send_header("Location", urlunsplit(parts._replace(path=parts.path + "/")))
                self.send_header("Content-Length", "0")
                self.end_headers()
                return None
            path = (path / "index.html").resolve()
            if not path.is_relative_to(root):
                self.send_error(403)
                return None
        if not path.is_file():
            self.send_error(404)
            return None
        try:
            source = path.open("rb")
        except OSError:
            self.send_error(404)
            return None

        stat = os.fstat(source.fileno())
        compressible = path.suffix.lower() in self.gzip_extensions
        compressed = compressible and accepts_gzip(self.headers.get("Accept-Encoding", ""))
        length = stat.st_size
        if compressed:
            with source:
                payload = gzip.compress(source.read(), mtime=0)
            source = io.BytesIO(payload)
            length = len(payload)

        self.send_response(200)
        self.send_header("Content-Type", self.guess_type(str(path)))
        self.send_header("Content-Length", str(length))
        self.send_header("Last-Modified", self.date_time_string(stat.st_mtime))
        self.send_header("Cache-Control", "no-cache" if path.suffix.lower() == ".html" else "public, max-age=600")
        if compressible:
            self.send_header("Vary", "Accept-Encoding")
        if compressed:
            self.send_header("Content-Encoding", "gzip")
        self.end_headers()
        return source


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", type=Path, required=True)
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()
    if not args.directory.is_dir():
        parser.error("--directory must name an existing preview directory")
    handler = partial(PreviewHandler, directory=str(args.directory.resolve()))
    with ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
        print(f"Serving private gzip preview at http://127.0.0.1:{server.server_port}", flush=True)
        server.serve_forever()


if __name__ == "__main__":
    main()
