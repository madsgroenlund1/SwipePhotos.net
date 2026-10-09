// macOS harness that runs the app's REAL networking code (Config, Models, APIClient,
// Session) against a server — catches decoding/streaming/multipart bugs that a
// type-check can't. See tools/selftest/run.sh.
import Foundation

var failures = 0
func check(_ name: String, _ ok: Bool, _ detail: String = "") {
    print("  \(ok ? "✓" : "✗") \(name)\(detail.isEmpty ? "" : " — \(detail)")")
    if !ok { failures += 1 }
}

let env = ProcessInfo.processInfo.environment
let email = env["TEST_EMAIL"] ?? "ios-selftest@example.com"
let code = env["TEST_CODE"] ?? "424242"
let mode = env["MODE"] ?? "live"   // "live" (real API) or "stream" (mock NDJSON server)
print("Server: \(Config.baseURL.absoluteString)")

if mode == "live" {
// ── Models decode real server JSON (dates with microseconds, nulls) ───────────
print("Decoding")
let decoder = JSONDecoder()
let me = """
{"email":"a@b.co","entitlement":{"active":true,"source":"apple","planId":"popular","planName":"Premium","photoQuota":15,
 "interval":"month","periodStart":"2026-09-06T04:06:21.000Z","periodEnd":"2026-10-06T04:06:21.000Z","willRenew":true,
 "canStartSet":true,"nextSetAvailableAt":null},
 "orders":[{"id":"6e4f101d-2c25-4f5a-bf4a-5a49029b625e","packageType":"elite","planName":"Pro","status":"ready",
 "createdAt":"2026-09-06T04:06:04.042984+00:00","photos":["https://x/0.jpg","https://x/1.jpg"]}],"token":null}
"""
do {
    // Uses the same date strategy as APIClient via a tiny loopback through its decoder
    let response: MeResponse = try APIClient.decodeForTests(Data(me.utf8))
    check("MeResponse", response.entitlement.active && response.entitlement.plan == .premium)
    check("microsecond timestamp parses", response.orders.first?.createdAt.timeIntervalSince1970 ?? 0 > 1_700_000_000)
    check("order state", response.orders.first?.state == .ready)
    _ = decoder
} catch {
    check("MeResponse decode", false, "\(error)")
}

// ── Sign in, /me, create an order ─────────────────────────────────────────────
print("Live API")
let session = AuthSession()
do {
    try await session.verifyCode(email: email, code: code)
    check("sign in with demo code", session.isSignedIn)
    let live: MeResponse = try await APIClient.shared.get("api/mobile/me")
    check("GET /me decodes", live.email == email, "orders: \(live.orders.count), entitlement.active: \(live.entitlement.active)")
    let orderId = try await OrderService.createOrder(plan: .starter, style: .formal, hasTattoos: false, previewURL: nil, mode: "purchase")
    check("create order", UUID(uuidString: orderId) != nil, orderId)

    // Multipart encoding, via the website's existing /api/upload (needs no new DB columns).
    var body = MultipartBody()
    body.addField("orderId", orderId)
    body.addFile("files", fileName: "front.jpg", bytes: Data(repeating: 0xFF, count: 40_000))
    struct Uploaded: Decodable { let urls: [String] }
    let uploaded: Uploaded = try await APIClient.shared.postMultipart("api/upload", body: body)
    check("multipart upload accepted by server", uploaded.urls.count == 1, uploaded.urls.first ?? "")

    // Mobile photo route + status (needs migration 015)
    var mobileBody = MultipartBody()
    mobileBody.addFile("files", fileName: PhotoSlot.front.uploadFileName, bytes: Data(repeating: 0xFF, count: 40_000))
    do {
        let _: OKDTO = try await APIClient.shared.postMultipart("api/mobile/orders/\(orderId)/photos", body: mobileBody)
        check("mobile photo upload", true)
        let status = try await OrderService.status(orderId: orderId)
        check("order status decodes", status.state == .pending, status.status)
    } catch let error as APIError {
        print("  – mobile photo route/status skipped: \(error.message) (apply migration 015 to enable)")
    }

    // Wrong-token handling
    TokenStore.shared.token = "forged.token.value"
    do { let _: MeResponse = try await APIClient.shared.get("api/mobile/me"); check("forged token rejected", false) }
    catch let error as APIError { check("forged token rejected", error.status == 401, error.message) }
    TokenStore.shared.token = nil

    // Account deletion cleans up the test user
    try await session.verifyCode(email: email, code: code)
    let _: OKDTO = try await APIClient.shared.post("api/account/delete", timeout: 120)
    do { let _: MeResponse = try await APIClient.shared.get("api/mobile/me"); check("token dead after account deletion", false) }
    catch let error as APIError { check("token dead after account deletion", error.status == 401) }
} catch {
    check("live API flow", false, "\(error)")
}

}

// ── NDJSON streaming against a mock server ────────────────────────────────────
if mode == "stream" {
    let url = URL(string: "/api/generate/preview")!
    print("Streaming (mock server, no AI credits used)")
    var seen: [String] = []
    var finalURLs: [String] = []
    let started = Date()
    var firstEventAfter: TimeInterval = 0
    let saved = APIClient.shared
    _ = saved
    do {
        try await APIClient.shared.stream(url.path, contentType: "application/json", body: Data("{}".utf8), timeout: 30) { event in
            if seen.isEmpty { firstEventAfter = Date().timeIntervalSince(started) }
            seen.append(event.status)
            if event.status == "done" { finalURLs = event.urls ?? [] }
        }
        check("all progress events received in order", seen == ["uploading", "preparing", "gen_1", "gen_2", "done"], seen.joined(separator: ","))
        check("final urls decoded", finalURLs.count == 2)
        check("events arrive incrementally (not buffered to the end)", firstEventAfter < 0.9, String(format: "first event after %.2fs", firstEventAfter))
    } catch {
        check("stream", false, "\(error)")
    }
    do {
        try await APIClient.shared.stream(url.path + "-error", contentType: "application/json", body: Data("{}".utf8), timeout: 30) { _ in }
        check("server-reported stream error is thrown", false)
    } catch let error as APIError {
        check("server-reported stream error is thrown", error.message.contains("Generation failed"), error.message)
    } catch { check("server-reported stream error is thrown", false, "\(error)") }
}

print(failures == 0 ? "\nAll checks passed" : "\n\(failures) check(s) FAILED")
exit(failures == 0 ? 0 : 1)
