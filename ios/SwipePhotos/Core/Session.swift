import Foundation
import Observation

/// Thread-safe holder so the networking layer can read the token off the main actor.
final class TokenStore: @unchecked Sendable {
    static let shared = TokenStore()
    private let lock = NSLock()
    private var value: String?
    var token: String? {
        get { lock.lock(); defer { lock.unlock() }; return value }
        set { lock.lock(); value = newValue; lock.unlock() }
    }
}

/// Who is signed in. The session token lives in the Keychain.
@Observable @MainActor
final class AuthSession {
    private(set) var email: String?
    private(set) var isSignedIn: Bool

    private let tokenKey = "session_token"
    private let emailKey = "sw_email"

    init() {
        let stored = Keychain.get(tokenKey)
        TokenStore.shared.token = stored
        isSignedIn = stored != nil
        email = UserDefaults.standard.string(forKey: emailKey)
        APIClient.shared.onUnauthorized = { [weak self] in
            Task { @MainActor in self?.signOut() }
        }
    }

    func requestCode(email: String) async throws {
        let _: OKDTO = try await APIClient.shared.post("api/mobile/auth/code/start", json: ["email": email])
    }

    func verifyCode(email: String, code: String) async throws {
        let response: TokenResponse = try await APIClient.shared.post(
            "api/mobile/auth/code/verify", json: ["email": email, "code": code])
        adopt(token: response.token, email: response.email)
    }

    func signInWithApple(identityToken: String) async throws {
        let response: TokenResponse = try await APIClient.shared.post(
            "api/mobile/auth/apple", json: ["identityToken": identityToken])
        adopt(token: response.token, email: response.email)
    }

    /// Swap in a refreshed token from /api/mobile/me.
    func rotate(token: String) {
        Keychain.set(token, for: tokenKey)
        TokenStore.shared.token = token
    }

    func signOut() {
        Keychain.delete(tokenKey)
        TokenStore.shared.token = nil
        UserDefaults.standard.removeObject(forKey: emailKey)
        email = nil
        isSignedIn = false
    }

    private func adopt(token: String, email: String) {
        Keychain.set(token, for: tokenKey)
        TokenStore.shared.token = token
        UserDefaults.standard.set(email, forKey: emailKey)
        self.email = email
        isSignedIn = true
    }
}
