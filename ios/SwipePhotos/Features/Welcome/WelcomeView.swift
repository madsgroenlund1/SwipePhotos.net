import SwiftUI

struct WelcomeView: View {
    @Environment(AppModel.self) private var app
    @State private var showSignIn = false
    @State private var legal: WebLink?

    private let steps: [(String, String, String)] = [
        ("1", "Upload 4 photos", "Free \u{00B7} no account needed"),
        ("2", "Preview your results", "Two free looks, picked for you"),
        ("3", "Choose a plan", "Pay with your Apple ID"),
        ("4", "Get your photos", "Delivered here and by e-mail"),
    ]

    var body: some View {
        ZStack {
            ScreenBackground()
            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    HStack {
                        Wordmark()
                        Spacer()
                        Button("Sign in") { showSignIn = true }
                            .font(.system(size: 15, weight: .semibold))
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color.white.opacity(0.06), in: Capsule())
                            .overlay(Capsule().stroke(Color.white.opacity(0.22), lineWidth: 1))
                            .foregroundStyle(.white)
                    }

                    VStack(alignment: .leading, spacing: 14) {
                        Text("Dating photos that look like you \u{2014} at your best.")
                            .font(.system(size: 38, weight: .bold))
                            .lineSpacing(2)
                        Text("Upload a few photos of yourself. Our AI places the real you in great settings, so your profile finally shows your best side.")
                            .font(.system(size: 17))
                            .foregroundStyle(Theme.textSecondary)
                            .lineSpacing(3)
                    }

                    VStack(spacing: 10) {
                        Button { app.showOnboarding = true } label: { Text("Generate your free preview \u{2192}") }
                            .buttonStyle(PrimaryButtonStyle())
                        Text("Free preview \u{00B7} No credit card to start")
                            .font(.system(size: 13))
                            .foregroundStyle(Theme.textMuted)
                            .frame(maxWidth: .infinity)
                    }

                    resultsSection
                    howItWorks
                    footer
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, 40)
            }
        }
        .sheet(isPresented: $showSignIn) { SignInView() }
        .sheet(item: $legal) { SafariView(url: $0.url).ignoresSafeArea() }
    }

    private var resultsSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Eyebrow(text: "Real results")
            Text("Before \u{2192} after").font(.system(size: 26, weight: .bold))
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 14) {
                    ForEach(WelcomeView.results, id: \.id) { result in
                        HStack(spacing: 10) {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("BEFORE").font(.system(size: 10, weight: .semibold)).foregroundStyle(Theme.textMuted)
                                RemoteImage(url: result.before)
                                    .frame(width: 96, height: 128)
                                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            }
                            VStack(alignment: .leading, spacing: 6) {
                                Text("AFTER \u{2728}").font(.system(size: 10, weight: .semibold)).foregroundStyle(Theme.blue400)
                                RemoteImage(url: result.after)
                                    .frame(width: 150, height: 128)
                                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            }
                        }
                        .card(padding: 12)
                    }
                }
            }
            .padding(.horizontal, -20)
            .contentMargins(.horizontal, 20, for: .scrollContent)
        }
    }

    private var howItWorks: some View {
        VStack(alignment: .leading, spacing: 14) {
            Eyebrow(text: "How it works")
            VStack(spacing: 10) {
                ForEach(steps, id: \.0) { step in
                    HStack(spacing: 14) {
                        Text(step.0)
                            .font(.system(size: 15, weight: .bold))
                            .frame(width: 34, height: 34)
                            .background(Theme.blue600.opacity(0.18), in: Circle())
                            .foregroundStyle(Theme.blue400)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(step.1).font(.system(size: 16, weight: .semibold))
                            Text(step.2).font(.system(size: 14)).foregroundStyle(Theme.textSecondary)
                        }
                        Spacer()
                    }
                    .card(padding: 14)
                }
            }
        }
    }

    private var footer: some View {
        VStack(spacing: 10) {
            HStack(spacing: 18) {
                Button("Terms") { legal = WebLink(url: Config.termsURL) }
                Button("Privacy") { legal = WebLink(url: Config.privacyURL) }
                Link("Support", destination: URL(string: "mailto:\(Config.supportEmail)")!)
            }
            .font(.system(size: 13))
            .foregroundStyle(Theme.textMuted)
            Text("AI-generated images. Results can vary.")
                .font(.system(size: 12))
                .foregroundStyle(Theme.textFaint)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 8)
    }

    private struct Result { let id: String; let before: URL?; let after: URL? }
    private static let results: [Result] = {
        let base = Config.baseURL.appendingPathComponent("photos/before-after")
        func make(_ id: String, beforeExt: String = "jpg") -> Result {
            Result(id: id,
                   before: base.appendingPathComponent("\(id)/before/1.\(beforeExt)"),
                   after: base.appendingPathComponent("\(id)/after/1.jpg"))
        }
        return [make("benni"), make("jason"), make("black"), make("julius", beforeExt: "jpeg")]
    }()
}
