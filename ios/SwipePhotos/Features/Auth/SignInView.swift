import SwiftUI
import AuthenticationServices

/// Passwordless sign-in: Sign in with Apple, or a 6-digit code sent by e-mail
/// (which also creates the account the first time).
struct SignInView: View {
    @Environment(AuthSession.self) private var session
    @Environment(\.dismiss) private var dismiss

    private enum Phase { case email, code }
    @State private var phase = Phase.email
    @State private var email = ""
    @State private var code = ""
    @State private var busy = false
    @State private var errorMessage: String?
    @FocusState private var focused: Bool

    var body: some View {
        ZStack {
            ScreenBackground()
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    HStack {
                        Wordmark()
                        Spacer()
                        Button { dismiss() } label: {
                            Image(systemName: "xmark")
                                .font(.system(size: 14, weight: .semibold))
                                .frame(width: 34, height: 34)
                                .background(Color.white.opacity(0.08), in: Circle())
                        }
                        .foregroundStyle(.white)
                        .accessibilityLabel("Close")
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text(phase == .email ? "Sign in or create your account" : "Check your e-mail")
                            .font(.system(size: 28, weight: .bold))
                        Text(phase == .email
                             ? "We\u{2019}ll send you a 6-digit code. No password needed."
                             : "We sent a 6-digit code to \(email).")
                            .font(.system(size: 16))
                            .foregroundStyle(Theme.textSecondary)
                    }

                    if let errorMessage { ErrorBanner(message: errorMessage) }

                    if phase == .email { emailStep } else { codeStep }
                }
                .padding(20)
            }
        }
        .onAppear { focused = true }
    }

    // MARK: Steps

    private var emailStep: some View {
        VStack(spacing: 16) {
            TextField("you@example.com", text: $email)
                .keyboardType(.emailAddress)
                .textContentType(.emailAddress)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .focused($focused)
                .submitLabel(.continue)
                .onSubmit { Task { await sendCode() } }
                .fieldStyle()

            Button { Task { await sendCode() } } label: {
                if busy { ProgressView().tint(.white) } else { Text("Continue") }
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(busy || !email.contains("@"))

            HStack {
                Rectangle().fill(Theme.border).frame(height: 1)
                Text("or").font(.system(size: 13)).foregroundStyle(Theme.textMuted)
                Rectangle().fill(Theme.border).frame(height: 1)
            }

            SignInWithAppleButton(.continue) { request in
                request.requestedScopes = [.email]
            } onCompletion: { result in
                Task { await handleApple(result) }
            }
            .signInWithAppleButtonStyle(.white)
            .frame(height: 52)
            .clipShape(RoundedRectangle(cornerRadius: Theme.radius, style: .continuous))
            .disabled(busy)
        }
    }

    private var codeStep: some View {
        VStack(spacing: 16) {
            TextField("123456", text: $code)
                .keyboardType(.numberPad)
                .textContentType(.oneTimeCode)
                .focused($focused)
                .multilineTextAlignment(.center)
                .font(.system(size: 30, weight: .bold, design: .monospaced))
                .fieldStyle()
                .onChange(of: code) { _, value in
                    let digits = String(value.filter(\.isNumber).prefix(6))
                    if digits != value { code = digits }
                    if digits.count == 6 { Task { await verify() } }
                }

            Button { Task { await verify() } } label: {
                if busy { ProgressView().tint(.white) } else { Text("Sign in") }
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(busy || code.count != 6)

            HStack(spacing: 18) {
                Button("Resend code") { Task { await sendCode(resend: true) } }
                Button("Use a different e-mail") { phase = .email; code = ""; errorMessage = nil }
            }
            .font(.system(size: 14))
            .foregroundStyle(Theme.textSecondary)
            .disabled(busy)
        }
    }

    // MARK: Actions

    private func sendCode(resend: Bool = false) async {
        let trimmed = email.trimmingCharacters(in: .whitespaces).lowercased()
        guard trimmed.contains("@") else { return }
        email = trimmed
        busy = true
        errorMessage = nil
        defer { busy = false }
        do {
            try await session.requestCode(email: trimmed)
            phase = .code
            if !resend { code = "" }
            focused = true
        } catch {
            errorMessage = (error as? APIError)?.message ?? error.localizedDescription
        }
    }

    private func verify() async {
        guard code.count == 6, !busy else { return }
        busy = true
        errorMessage = nil
        defer { busy = false }
        do {
            try await session.verifyCode(email: email, code: code)
            dismiss()
        } catch {
            errorMessage = (error as? APIError)?.message ?? error.localizedDescription
            code = ""
        }
    }

    private func handleApple(_ result: Result<ASAuthorization, Error>) async {
        switch result {
        case .failure(let error):
            if (error as? ASAuthorizationError)?.code != .canceled {
                errorMessage = "Sign in with Apple didn\u{2019}t complete. Please try again."
            }
        case .success(let authorization):
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let tokenData = credential.identityToken,
                  let token = String(data: tokenData, encoding: .utf8) else {
                errorMessage = "Sign in with Apple didn\u{2019}t return a valid token."
                return
            }
            busy = true
            defer { busy = false }
            do {
                try await session.signInWithApple(identityToken: token)
                dismiss()
            } catch {
                errorMessage = (error as? APIError)?.message ?? error.localizedDescription
            }
        }
    }
}

private extension View {
    func fieldStyle() -> some View {
        self
            .font(.system(size: 18))
            .padding(16)
            .background(Color.white.opacity(0.05), in: RoundedRectangle(cornerRadius: Theme.radius, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: Theme.radius, style: .continuous).stroke(Theme.border, lineWidth: 1))
    }
}
