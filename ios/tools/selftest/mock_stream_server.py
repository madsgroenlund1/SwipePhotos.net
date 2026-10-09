#!/usr/bin/env python3
"""Mock NDJSON server mimicking /api/generate/preview (incremental lines, no AI cost)."""
import json, sys, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

class H(BaseHTTPRequestHandler):
    def do_POST(self):
        self.rfile.read(int(self.headers.get("Content-Length", 0)))
        self.send_response(200)
        self.send_header("Content-Type", "application/x-ndjson")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        if self.path.endswith("-error"):
            events = [{"status": "uploading"}, {"status": "error", "error": "Generation failed — please try again"}]
        else:
            events = [{"status": "uploading"}, {"status": "preparing"}, {"status": "gen_1"}, {"status": "gen_2"},
                      {"status": "done", "urls": ["https://x/a.jpg", "https://x/b.jpg"]}]
        for e in events:
            self.wfile.write((json.dumps(e) + "\n").encode()); self.wfile.flush(); time.sleep(0.35)
    def log_message(self, *a): pass

ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1])), H).serve_forever()
