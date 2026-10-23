import gzip
import http.client
import importlib.util
import tempfile
import threading
import unittest
from contextlib import closing
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path

spec = importlib.util.spec_from_file_location("preview", Path(__file__).with_name("serve-lighthouse.py"))
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)


class PreviewServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory()
        cls.root = Path(cls.temporary.name) / "site"
        cls.root.mkdir()
        cls.text = b"private preview content " * 100
        for extension in ("html", "css", "js", "mjs", "json", "svg"):
            (cls.root / f"index.{extension}").write_bytes(cls.text)
        cls.binary = bytes(range(256))
        (cls.root / "image.png").write_bytes(cls.binary)
        secret = Path(cls.temporary.name) / "secret.txt"
        secret.write_text("outside preview")
        (cls.root / "escape.txt").symlink_to(secret)

        class QuietHandler(preview.PreviewHandler):
            def log_message(self, *_):
                pass

        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(cls.root)))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        cls.temporary.cleanup()

    def request(self, path, encoding=None, method="GET"):
        headers = {"Accept-Encoding": encoding} if encoding is not None else {}
        with closing(http.client.HTTPConnection("127.0.0.1", self.server.server_port)) as connection:
            connection.request(method, path, headers=headers)
            response = connection.getresponse()
            return response.status, dict(response.getheaders()), response.read()

    def test_text_types_receive_valid_gzip_and_mime_types(self):
        types = {
            "html": "text/html",
            "css": "text/css",
            "js": ("text/javascript", "application/javascript"),
            "mjs": "text/javascript",
            "json": "application/json",
            "svg": "image/svg+xml",
        }
        for extension, expected_type in types.items():
            with self.subTest(extension=extension):
                status, headers, body = self.request(f"/index.{extension}", "br, gzip")
                self.assertEqual(status, 200)
                self.assertEqual(headers["Content-Encoding"], "gzip")
                self.assertEqual(headers["Vary"], "Accept-Encoding")
                self.assertEqual(int(headers["Content-Length"]), len(body))
                self.assertIn(headers["Content-Type"], (expected_type,) if isinstance(expected_type, str) else expected_type)
                self.assertEqual(gzip.decompress(body), self.text)
                self.assertLess(len(body), len(self.text))

    def test_identity_and_disabled_gzip_preserve_bytes(self):
        for encoding in (None, "br", "gzip;q=0, *;q=1"):
            with self.subTest(encoding=encoding):
                status, headers, body = self.request("/", encoding)
                self.assertEqual(status, 200)
                self.assertNotIn("Content-Encoding", headers)
                self.assertEqual(body, self.text)
                self.assertEqual(int(headers["Content-Length"]), len(body))
                self.assertEqual(headers["Cache-Control"], "no-cache")

    def test_binary_assets_are_not_compressed(self):
        status, headers, body = self.request("/image.png", "gzip")
        self.assertEqual(status, 200)
        self.assertEqual(headers["Content-Type"], "image/png")
        self.assertNotIn("Content-Encoding", headers)
        self.assertEqual(headers["Cache-Control"], "public, max-age=600")
        self.assertEqual(body, self.binary)

    def test_head_matches_get_headers_without_a_body(self):
        status, get_headers, body = self.request("/index.mjs", "gzip")
        head_status, head_headers, head_body = self.request("/index.mjs", "gzip", "HEAD")
        self.assertEqual(head_status, status)
        for header in ("Content-Type", "Content-Length", "Content-Encoding", "Cache-Control", "Vary", "Last-Modified"):
            self.assertEqual(head_headers[header], get_headers[header])
        self.assertEqual(int(head_headers["Content-Length"]), len(body))
        self.assertEqual(head_body, b"")

    def test_missing_files_and_paths_outside_root_are_not_served(self):
        for path, expected_status in (("/missing.html", 404), ("/../secret.txt", 404), ("/%2e%2e/secret.txt", 404), ("/escape.txt", 403)):
            with self.subTest(path=path):
                status, _, body = self.request(path, "gzip")
                self.assertEqual(status, expected_status)
                self.assertNotIn(b"outside preview", body)


if __name__ == "__main__":
    unittest.main()
