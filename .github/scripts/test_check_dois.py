import importlib.util
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
import unittest
from unittest.mock import patch
from urllib.error import URLError


SPEC = importlib.util.spec_from_file_location("check_dois", Path(__file__).with_name("check-dois.py"))
checker = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(checker)


class DOIExtractionTests(unittest.TestCase):
    def test_bibliography_front_matter_and_literal_links(self):
        text = '''
doi = {10.1016/0041-5553(63)90382-3},
DOI = "10.1137/15M1009597",
citation_doi: 10.5281/zenodo.23521024
_[Article](https://doi.org/10.1007/s10107-024-02061-8)_.
<https://dx.doi.org/10.1016/0041-5553%2863%2990382-3>
'''
        self.assertEqual(
            checker.extract_dois(text),
            {
                "10.1016/0041-5553(63)90382-3",
                "10.1137/15M1009597",
                "10.5281/zenodo.23521024",
                "10.1007/s10107-024-02061-8",
            },
        )

    def test_empty_or_malformed_fields_are_not_silently_ignored(self):
        self.assertEqual(checker.extract_dois('doi = {},\ncitation_doi: "not-a-doi"\n'), {"", "not-a-doi"})
        with self.assertRaisesRegex(checker.DOIError, "Invalid DOI syntax"):
            checker.check_doi("not-a-doi")

    def test_source_scope_matches_link_checker_inputs(self):
        self.assertTrue(checker.is_source(Path("_bibliography/papers.bib")))
        self.assertTrue(checker.is_source(Path("_posts/post.md")))
        self.assertTrue(checker.is_source(Path("_data/socials.yml")))
        self.assertFalse(checker.is_source(Path("README.md")))
        self.assertFalse(checker.is_source(Path("_pages/404.md")))
        self.assertFalse(checker.is_source(Path("lighthouse_results/report.html")))
        self.assertFalse(checker.is_source(Path(".github/workflows/deploy.yml")))


class DOIResolverTests(unittest.TestCase):
    def setUp(self):
        self.requests = []
        self.responses = [(302, "https://publisher.example/article")]
        owner = self

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                owner.requests.append(self.path)
                status, location = owner.responses.pop(0)
                self.send_response(status)
                if location:
                    self.send_header("Location", location)
                self.end_headers()

            def log_message(self, *_args):
                pass

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.resolver = f"http://127.0.0.1:{self.server.server_port}/"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()

    def test_valid_redirect_does_not_request_the_publisher(self):
        self.responses = [(302, self.resolver + "publisher"), (403, None)]
        self.assertEqual(checker.check_doi("10.1137/15M1009597", resolver=self.resolver), (302, self.resolver + "publisher"))
        self.assertEqual(self.requests, ["/10.1137/15M1009597"])

    def test_exact_unknown_doi_is_rejected_without_retry(self):
        self.responses = [(404, None)]
        doi = "10.1007/not-a-real-doi-codex-release-check-20261023"
        with self.assertRaisesRegex(checker.DOIError, "HTTP 404"):
            checker.check_doi(doi, resolver=self.resolver)
        self.assertEqual(self.requests, ["/" + doi])

    def test_forbidden_and_redirects_without_valid_locations_fail(self):
        for status, location in [(403, None), (302, None), (302, "/relative"), (302, "javascript:alert(1)"), (200, None)]:
            with self.subTest(status=status, location=location):
                self.responses = [(status, location)]
                with self.assertRaises(checker.DOIError):
                    checker.check_doi("10.1137/15M1009597", resolver=self.resolver)

    @patch.object(checker.time, "sleep")
    def test_transient_errors_retry_then_succeed(self, sleep):
        self.responses = [(503, None), (429, None), (302, "https://publisher.example/article")]
        self.assertEqual(checker.check_doi("10.1137/15M1009597", resolver=self.resolver)[0], 302)
        self.assertEqual(len(self.requests), 3)
        self.assertEqual(sleep.call_count, 2)

    @patch.object(checker.time, "sleep")
    @patch("urllib.request.OpenerDirector.open", side_effect=URLError("connection timed out"))
    def test_network_errors_exhaust_limited_retries_and_fail(self, open_request, sleep):
        with self.assertRaisesRegex(checker.DOIError, "connection timed out"):
            checker.check_doi("10.1137/15M1009597")
        self.assertEqual(open_request.call_count, 3)
        self.assertEqual(sleep.call_count, 2)


if __name__ == "__main__":
    unittest.main()
