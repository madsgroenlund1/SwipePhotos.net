import SwiftUI
import StoreKit

struct AccountTab: View {
    @Environment(AppModel.self) private var app
    @Environment(AuthSession.self) private var session
    @Environment(StoreManager.self) private var store

    @State private var legal: WebLink?
    @State private var showManage = false
    @State private var confirmDelete = false
    @State private var deleting = false
    @State private var restoring = false
    @State private var message: String?

    private var ent: EntitlementDTO { app.entitlement }

    var body: some View {
        NavigationStack {
            ZStack {
                ScreenBackground()
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        Wordmark()
                        account
                        subscription
                        if ent.active { usage }
                        help
                        dangerZone
                        Text("SwipePhotos \(appVersion)")
                            .font(.system(size: 12)).foregroundStyle(Theme.textFaint)
                            .frame(maxWidth: .infinity)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 12)
                    .padding(.bottom, 32)
                }
                .refreshable { await app.refresh(session: session) }
            }
            .navigationBarHidden(true)
        }
        .sheet(item: $legal) { SafariView(url: $0.url).ignoresSafeArea() }
        .manageSubscriptionsSheet(isPresented: $showManage)
        .alert("Delete your account?", isPresented: $confirmDelete) {
            Button("Delete everything", role: .destructive) { Task { await deleteAccount() } }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This permanently deletes your account, uploaded photos and all generated photos \u{2014} also on swipephotos.net. This can\u{2019}t be undone."
                 + (ent.source == "apple" ? "\n\nYour App Store subscription is NOT cancelled by this \u{2014} cancel it in Settings \u{2192} Apple ID \u{2192} Subscriptions." : ""))
        }
        .alert(message ?? "", isPresented: Binding(get: { message != nil }, set: { if !$0 { message = nil } })) {
            Button("OK", role: .cancel) {}
        }
    }

    // MARK: Sections

    private var account: some View {
        VStack(alignment: .leading, spacing: 4) {
            Eyebrow(text: "Signed in as")
            Text(session.email ?? app.me?.email ?? "").font(.system(size: 17, weight: .semibold))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .card()
    }

    private var subscription: some View {
        VStack(alignment: .leading, spacing: 12) {
            Eyebrow(text: "Subscription")
            if ent.active {
                HStack {
                    Text("\(ent.planName ?? "Plan") \u{00B7} \(ent.interval == "year" ? "yearly" : "monthly")")
                        .font(.system(size: 18, weight: .bold))
                    Spacer()
                    Badge(text: ent.willRenew ? "Active" : "Ends soon", tint: ent.willRenew ? Theme.green : Theme.amber)
                }
                if let end = ent.periodEnd {
                    Text(ent.willRenew ? "Renews on \(end.shortFormatted)" : "Access until \(end.shortFormatted)")
                        .font(.system(size: 14)).foregroundStyle(Theme.textSecondary)
                }
                if ent.source == "apple" {
                    Button { showManage = true } label: { Text("Manage subscription") }
                        .buttonStyle(SecondaryButtonStyle())
                } else {
                    Text("This subscription is billed outside the App Store.")
                        .font(.system(size: 13)).foregroundStyle(Theme.textMuted)
                }
            } else {
                Text("No active plan").font(.system(size: 18, weight: .bold))
                Text("Start with a free preview, then choose a plan.")
                    .font(.system(size: 14)).foregroundStyle(Theme.textSecondary)
                Button { app.showOnboarding = true } label: { Text("Get started") }
                    .buttonStyle(PrimaryButtonStyle())
            }
            Button { Task { await restore() } } label: {
                Text(restoring ? "Restoring\u{2026}" : "Restore Purchases")
            }
            .font(.system(size: 14, weight: .semibold))
            .foregroundStyle(Theme.blue400)
            .disabled(restoring)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .card()
    }

    private var usage: some View {
        VStack(alignment: .leading, spacing: 10) {
            Eyebrow(text: "This month")
            HStack {
                Text(ent.canStartSet ? "0 / \(ent.photoQuota) photos used" : "\(ent.photoQuota) / \(ent.photoQuota) photos used")
                    .font(.system(size: 16, weight: .semibold))
                Spacer()
            }
            ProgressView(value: ent.canStartSet ? 0 : 1).tint(Theme.blue500)
            Text(ent.canStartSet ? "Your set for this month hasn\u{2019}t been created yet."
                 : (ent.nextSetAvailableAt.map { "Next set available on \($0.shortFormatted)." } ?? ""))
                .font(.system(size: 13)).foregroundStyle(Theme.textMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .card()
    }

    private var help: some View {
        VStack(spacing: 0) {
            row("Terms of Use", icon: "doc.text") { legal = WebLink(url: Config.termsURL) }
            Divider().overlay(Theme.border)
            row("Privacy Policy", icon: "lock.shield") { legal = WebLink(url: Config.privacyURL) }
            Divider().overlay(Theme.border)
            Link(destination: URL(string: "mailto:\(Config.supportEmail)")!) {
                rowLabel("Contact support", icon: "envelope")
            }
            .buttonStyle(.plain)
        }
        .card(padding: 4)
    }

    private var dangerZone: some View {
        VStack(spacing: 10) {
            Button { session.signOut(); app.reset() } label: { Text("Sign out") }
                .buttonStyle(SecondaryButtonStyle())
            Button { confirmDelete = true } label: {
                if deleting { ProgressView().tint(Theme.red) } else { Text("Delete account") }
            }
            .buttonStyle(DestructiveButtonStyle())
            .disabled(deleting)
        }
    }

    // MARK: Pieces

    private func row(_ title: String, icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) { rowLabel(title, icon: icon) }.buttonStyle(.plain)
    }

    private func rowLabel(_ title: String, icon: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon).frame(width: 24).foregroundStyle(Theme.blue400)
            Text(title).font(.system(size: 16))
            Spacer()
            Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(Theme.textFaint)
        }
        .padding(14)
        .contentShape(Rectangle())
    }

    private var appVersion: String {
        let info = Bundle.main.infoDictionary
        let version = info?["CFBundleShortVersionString"] as? String ?? "1.0"
        let build = info?["CFBundleVersion"] as? String ?? "1"
        return "\(version) (\(build))"
    }

    // MARK: Actions

    private func restore() async {
        restoring = true
        defer { restoring = false }
        do {
            try await store.restore()
            await app.syncPurchases(store: store, session: session)
            message = app.entitlement.active ? "Your subscription has been restored." : "No active subscription was found for this Apple ID."
        } catch {
            message = "Purchases couldn\u{2019}t be restored. Please try again."
        }
    }

    private func deleteAccount() async {
        deleting = true
        defer { deleting = false }
        do {
            let _: OKDTO = try await APIClient.shared.post("api/account/delete", timeout: 120)
            PendingPurchaseStore.clear()
            session.signOut()
            app.reset()
        } catch {
            message = (error as? APIError)?.message ?? "We couldn\u{2019}t delete your account. Please contact \(Config.supportEmail)."
        }
    }
}
