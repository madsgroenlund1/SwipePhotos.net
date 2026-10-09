import SwiftUI
import StoreKit

/// Plan picker + purchase. Follows App Store guideline 3.1.2: clear price and
/// period, auto-renewal disclosure, Terms & Privacy links and Restore Purchases.
struct PaywallView: View {
    @Environment(OnboardingModel.self) private var model
    @Environment(AppModel.self) private var app
    @Environment(AuthSession.self) private var session
    @Environment(StoreManager.self) private var store

    @State private var showSignIn = false
    @State private var legal: WebLink?
    @State private var errorMessage: String?
    @State private var notice: String?
    @State private var restoring = false

    private var coversWithSubscription: Bool { session.isSignedIn && app.entitlement.active && app.entitlement.canStartSet }
    private var subscriptionUsedUp: Bool { session.isSignedIn && app.entitlement.active && !app.entitlement.canStartSet }
    private var selectedProduct: Product? { store.product(model.plan, model.billing) }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    previewHeader
                    if coversWithSubscription { coveredCard }
                    else if subscriptionUsedUp { usedUpCard }
                    else { plansSection }
                    if let notice { noticeBanner(notice) }
                    if let errorMessage { ErrorBanner(message: errorMessage) }
                    if !coversWithSubscription && !subscriptionUsedUp { legalFooter }
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 24)
            }
            footerButton
        }
        .task {
            if store.products.isEmpty { await store.loadProducts() }
            if session.isSignedIn { await app.refresh(session: session) }
        }
        .sheet(isPresented: $showSignIn, onDismiss: {
            if session.isSignedIn { Task { await app.refresh(session: session) } }
        }) { SignInView() }
        .sheet(item: $legal) { SafariView(url: $0.url).ignoresSafeArea() }
    }

    // MARK: Sections

    private var previewHeader: some View {
        HStack(spacing: 14) {
            RemoteImage(url: URL(string: model.displayPreviewURL ?? ""))
                .frame(width: 84, height: 112)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            VStack(alignment: .leading, spacing: 6) {
                Badge(text: "Your preview is ready", tint: Theme.green)
                Text("Your matches are waiting").font(.system(size: 22, weight: .bold))
                Text("Unlock your full set of photos in your chosen style.")
                    .font(.system(size: 14)).foregroundStyle(Theme.textSecondary)
            }
        }
    }

    private var plansSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            billingToggle
            ForEach(Plan.allCases) { plan in planCard(plan) }
            if store.loadFailed || (store.products.isEmpty && !store.isLoading) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("We couldn\u{2019}t load the plans from the App Store.")
                        .font(.system(size: 14)).foregroundStyle(Theme.textSecondary)
                    Button("Try again") { Task { await store.loadProducts() } }
                        .buttonStyle(SecondaryButtonStyle())
                }
            }
        }
    }

    private var billingToggle: some View {
        HStack(spacing: 4) {
            ForEach(Billing.allCases) { billing in
                Button { model.billing = billing } label: {
                    HStack(spacing: 6) {
                        Text(billing == .monthly ? "Monthly" : "Yearly").font(.system(size: 15, weight: .semibold))
                        if billing == .yearly { Badge(text: "50% OFF", tint: Theme.green) }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(model.billing == billing ? Color.white.opacity(0.12) : .clear,
                                in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .foregroundStyle(model.billing == billing ? .white : Theme.textSecondary)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(4)
        .background(Color.white.opacity(0.05), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Theme.border, lineWidth: 1))
    }

    private func planCard(_ plan: Plan) -> some View {
        let selected = model.plan == plan
        let product = store.product(plan, model.billing)
        return Button { model.plan = plan } label: {
            HStack(alignment: .top, spacing: 14) {
                Image(systemName: selected ? "largecircle.fill.circle" : "circle")
                    .font(.system(size: 22))
                    .foregroundStyle(selected ? Theme.blue500 : Theme.textFaint)
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 8) {
                        Text(plan.name).font(.system(size: 18, weight: .bold))
                        if plan.isPopular { Badge(text: "Most popular") }
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        ForEach(plan.features, id: \.self) { feature in
                            Label(feature, systemImage: "checkmark")
                                .font(.system(size: 13))
                                .foregroundStyle(Theme.textSecondary)
                        }
                    }
                }
                Spacer(minLength: 8)
                VStack(alignment: .trailing, spacing: 2) {
                    if let product {
                        Text(product.displayPrice).font(.system(size: 18, weight: .bold))
                        Text(model.billing == .monthly ? "per month" : "per year")
                            .font(.system(size: 12)).foregroundStyle(Theme.textMuted)
                        if model.billing == .yearly {
                            Text("\((product.price / 12).formatted(product.priceFormatStyle))/mo")
                                .font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.green)
                        }
                    } else {
                        ProgressView().tint(Theme.textMuted)
                    }
                }
            }
            .padding(16)
            .background(selected ? Theme.blue600.opacity(0.10) : Theme.card,
                        in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(selected ? Theme.blue500 : Theme.border, lineWidth: selected ? 2 : 1)
            )
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(selected ? [.isSelected] : [])
    }

    private var coveredCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Included in your \(app.entitlement.planName ?? "") plan")
                .font(.system(size: 18, weight: .bold))
            Text("This month\u{2019}s photo set is part of your subscription \u{2014} nothing more to pay.")
                .font(.system(size: 14)).foregroundStyle(Theme.textSecondary)
        }
        .card()
    }

    private var usedUpCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("You\u{2019}ve used this month\u{2019}s set").font(.system(size: 18, weight: .bold))
            Text(app.entitlement.nextSetAvailableAt.map { "Your next photo set is available on \($0.shortFormatted)." }
                 ?? "Your next photo set is available soon.")
                .font(.system(size: 14)).foregroundStyle(Theme.textSecondary)
        }
        .card()
    }

    private func noticeBanner(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "clock.fill").foregroundStyle(Theme.amber)
            Text(text).font(.system(size: 14))
        }
        .padding(14)
        .background(Theme.amber.opacity(0.10), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private var legalFooter: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Payment is charged to your Apple ID at confirmation of purchase. The subscription renews automatically at the price shown unless it is cancelled at least 24 hours before the end of the current period. You can manage or cancel it anytime in Settings \u{2192} Apple ID \u{2192} Subscriptions.")
            Text("AI-generated photos can\u{2019}t be guaranteed to be 100% perfect. If one isn\u{2019}t right, contact support and we\u{2019}ll regenerate it free of charge.")
            HStack(spacing: 18) {
                Button("Terms of Use") { legal = WebLink(url: Config.termsURL) }
                Button("Privacy Policy") { legal = WebLink(url: Config.privacyURL) }
                Button(restoring ? "Restoring\u{2026}" : "Restore Purchases") { Task { await restore() } }
                    .disabled(restoring)
            }
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(Theme.blue400)
        }
        .font(.system(size: 12))
        .foregroundStyle(Theme.textMuted)
        .lineSpacing(2)
    }

    // MARK: Footer button

    private var footerButton: some View {
        VStack(spacing: 8) {
            if subscriptionUsedUp {
                Button { app.showOnboarding = false } label: { Text("Close") }
                    .buttonStyle(SecondaryButtonStyle())
            } else {
                Button { Task { await continueTapped() } } label: {
                    if model.isWorking { ProgressView().tint(.white) }
                    else { Text(coversWithSubscription ? "Create my photos" : session.isSignedIn ? "Subscribe" : "Continue") }
                }
                .buttonStyle(PrimaryButtonStyle())
                .disabled(model.isWorking || (!coversWithSubscription && selectedProduct == nil))
                if !session.isSignedIn {
                    Text("You\u{2019}ll create your account in the next step.")
                        .font(.system(size: 12)).foregroundStyle(Theme.textMuted)
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 10)
        .padding(.bottom, 12)
        .background(Theme.bg.opacity(0.96))
    }

    // MARK: Actions

    private func continueTapped() async {
        errorMessage = nil
        notice = nil
        guard session.isSignedIn else { showSignIn = true; return }

        do {
            let outcome = try await model.checkout(product: selectedProduct, entitlement: app.entitlement, store: store)
            switch outcome {
            case .started:
                await app.refresh(session: session)
            case .cancelled:
                break
            case .awaitingApproval:
                notice = "Your purchase is waiting for approval (for example Ask to Buy). We\u{2019}ll start your photos as soon as it\u{2019}s approved \u{2014} you can close this screen."
            }
        } catch {
            errorMessage = (error as? APIError)?.message ?? error.localizedDescription
        }
    }

    private func restore() async {
        restoring = true
        defer { restoring = false }
        errorMessage = nil
        do {
            try await store.restore()
            if session.isSignedIn {
                await app.syncPurchases(store: store, session: session)
            } else {
                notice = "Sign in to restore your subscription."
                showSignIn = true
            }
        } catch {
            errorMessage = "Purchases couldn\u{2019}t be restored. Please try again."
        }
    }
}
