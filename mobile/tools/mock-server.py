#!/usr/bin/env python3
"""Tiny mock of the SwipePhotos API for UI testing the app on web (no AI credits, no database).
   python3 tools/mock-server.py 8787      then:  EXPO_PUBLIC_API_URL=http://localhost:8787 npx expo start --web
   State: POST /mock/state {"active":true,"canStartSet":true}  to flip the subscription."""
import json, sys, time, uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

SITE = "https://www.swipephotos.net"
STATE = {"active": False, "canStartSet": True, "orders": [], "polls": {}}
SCENES = [f"{SITE}/photos/presets/scene-{s}.jpg" for s in ("restaurant", "formal")]
AFTER = [f"{SITE}/photos/before-after/{i}/after/1.jpg" for i in ("benni", "jason", "black", "julius", "alex", "andreas")]

def entitlement():
    if not STATE["active"]:
        return {"active": False, "source": None, "planId": None, "planName": None, "photoQuota": 0, "interval": None,
                "periodStart": None, "periodEnd": None, "willRenew": False, "canStartSet": False, "nextSetAvailableAt": None}
    return {"active": True, "source": "apple", "planId": "popular", "planName": "Premium", "photoQuota": 15, "interval": "month",
            "periodStart": "2026-10-01T00:00:00.000Z", "periodEnd": "2026-11-01T00:00:00.000Z", "willRenew": True,
            "canStartSet": STATE["canStartSet"], "nextSetAvailableAt": None if STATE["canStartSet"] else "2026-11-01T00:00:00.000Z"}

class H(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    def _json(self, obj, status=200):
        body = json.dumps(obj).encode()
        self.send_response(status); self._cors()
        self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(body)))
        self.end_headers(); self.wfile.write(body)
    def _body(self):
        n = int(self.headers.get("Content-Length", 0))
        return self.rfile.read(n) if n else b""
    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()
    def _stream(self, events, delay=0.5):
        self.send_response(200); self._cors()
        self.send_header("Content-Type", "application/x-ndjson"); self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        for e in events:
            self.wfile.write((json.dumps(e) + "\n").encode()); self.wfile.flush(); time.sleep(delay)
    def do_GET(self):
        p = self.path.split("?")[0]
        if p == "/api/mobile/me":
            return self._json({"email": "demo@swipephotos.net", "entitlement": entitlement(), "orders": STATE["orders"], "token": None})
        if p.startswith("/api/mobile/orders/"):
            oid = p.rsplit("/", 1)[1]
            STATE["polls"][oid] = STATE["polls"].get(oid, 0) + 1
            ready = STATE["polls"][oid] >= 2
            order = next((o for o in STATE["orders"] if o["id"] == oid), None)
            if order and ready:
                order["status"] = "ready"; order["photos"] = AFTER
            return self._json({"id": oid, "status": "ready" if ready else "generating", "planName": "Premium", "photos": AFTER if ready else []})
        self._json({"error": "not found"}, 404)
    def do_POST(self):
        p = self.path.split("?")[0]; raw = self._body()
        if p == "/mock/state":
            STATE.update(json.loads(raw or b"{}")); return self._json({"ok": True, **{k: STATE[k] for k in ("active", "canStartSet")}})
        if p == "/api/mobile/auth/code/start": return self._json({"ok": True})
        if p == "/api/mobile/auth/code/verify":
            code = json.loads(raw).get("code")
            if code != "123456": return self._json({"error": "Incorrect code."}, 401)
            return self._json({"token": "mock.token.value", "email": "demo@swipephotos.net"})
        if p == "/api/mobile/auth/apple": return self._json({"token": "mock.token.value", "email": "demo@swipephotos.net"})
        if p == "/api/generate/preview":
            return self._stream([{"status": "uploading"}, {"status": "preparing"}, {"status": "gen_1"}, {"status": "gen_2"},
                                 {"status": "checking"}, {"status": "saving"}, {"status": "done", "urls": SCENES}], 0.6)
        if p == "/api/refine/preview":
            return self._stream([{"status": s} for s in ("preparing", "checking_alignment", "blending", "skin_tone", "texture", "artifacts", "quality", "saving")]
                                + [{"status": "done", "url": SCENES[0]}], 0.3)
        if p == "/api/mobile/orders":
            oid = str(uuid.uuid4())
            STATE["orders"].insert(0, {"id": oid, "packageType": "popular", "planName": "Premium", "status": "generating",
                                       "createdAt": "2026-10-12T10:00:00.000Z", "photos": []})
            return self._json({"orderId": oid})
        if p.endswith("/photos") or p.endswith("/iap") or p.endswith("/play") or p.endswith("/start") or p.endswith("/sync"):
            if p.endswith("/start"): STATE["canStartSet"] = False
            if p.endswith("/iap") or p.endswith("/play"): STATE["active"] = True; STATE["canStartSet"] = False
            return self._json({"ok": True, "status": "generating", "entitlement": entitlement(), "restored": False})
        if p == "/api/account/delete": return self._json({"ok": True})
        self._json({"error": "not found"}, 404)
    def log_message(self, *a): pass

ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1]) if len(sys.argv) > 1 else 8787), H).serve_forever()
