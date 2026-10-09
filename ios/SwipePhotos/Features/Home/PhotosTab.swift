import SwiftUI

struct PhotosTab: View {
    @Environment(AppModel.self) private var app
    @Environment(AuthSession.self) private var session

    var body: some View {
        NavigationStack {
            ZStack {
                ScreenBackground()
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        HStack {
                            Wordmark()
                            Spacer()
                        }
                        newSetCard
                        if let error = app.loadError, app.me == nil { ErrorBanner(message: error) }

                        if app.orders.isEmpty {
                            if app.me != nil || !app.isRefreshing { emptyState }
                        } else {
                            Eyebrow(text: "Your photo sets")
                            ForEach(app.orders) { order in
                                NavigationLink(value: order.id) { OrderRow(order: order) }
                                    .buttonStyle(.plain)
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 12)
                    .padding(.bottom, 32)
                }
                .refreshable { await app.refresh(session: session) }
            }
            .navigationBarHidden(true)
            .navigationDestination(for: String.self) { OrderDetailView(orderId: $0) }
        }
    }

    // MARK: New set

    @ViewBuilder private var newSetCard: some View {
        let ent = app.entitlement
        if ent.active && ent.canStartSet {
            VStack(alignment: .leading, spacing: 12) {
                Badge(text: "\(ent.planName ?? "Your") plan", tint: Theme.green)
                Text("Your photo set is ready to create").font(.system(size: 20, weight: .bold))
                Text("Your subscription includes \(ent.photoQuota) new photos this month.")
                    .font(.system(size: 14)).foregroundStyle(Theme.textSecondary)
                Button { app.showOnboarding = true } label: { Text("Create new photos") }
                    .buttonStyle(PrimaryButtonStyle())
            }
            .card()
        } else if ent.active {
            VStack(alignment: .leading, spacing: 6) {
                Badge(text: "\(ent.planName ?? "Your") plan", tint: Theme.green)
                Text("This month\u{2019}s set is done").font(.system(size: 18, weight: .bold))
                Text(ent.nextSetAvailableAt.map { "Your next set is available on \($0.shortFormatted)." } ?? "Your next set is available soon.")
                    .font(.system(size: 14)).foregroundStyle(Theme.textSecondary)
            }
            .card()
        } else if app.me != nil {
            VStack(alignment: .leading, spacing: 12) {
                Text("Get more photos").font(.system(size: 20, weight: .bold))
                Text("Start with a free preview, then pick a plan.")
                    .font(.system(size: 14)).foregroundStyle(Theme.textSecondary)
                Button { app.showOnboarding = true } label: { Text("Generate your photos \u{2192}") }
                    .buttonStyle(PrimaryButtonStyle())
            }
            .card()
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "photo.on.rectangle.angled").font(.system(size: 40)).foregroundStyle(Theme.textFaint)
            Text("No photos yet").font(.system(size: 18, weight: .semibold))
            Text("Your finished photo sets will appear here.")
                .font(.system(size: 14)).foregroundStyle(Theme.textMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }
}

struct OrderRow: View {
    let order: OrderDTO

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 12, style: .continuous).fill(Color.white.opacity(0.05))
                if let first = order.photos.first {
                    RemoteImage(url: URL(string: first)).clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                } else {
                    Image(systemName: order.state == .failed ? "exclamationmark.triangle" : "hourglass")
                        .foregroundStyle(Theme.textMuted)
                }
            }
            .frame(width: 64, height: 80)

            VStack(alignment: .leading, spacing: 6) {
                Text("\(order.planName) set").font(.system(size: 17, weight: .semibold))
                Text(order.createdAt.shortFormatted).font(.system(size: 13)).foregroundStyle(Theme.textMuted)
                Badge(text: order.state == .ready ? "\(order.photos.count) photos" : order.state.label,
                      tint: order.state == .ready ? Theme.green : order.state == .failed ? Theme.amber : Theme.blue500)
            }
            Spacer()
            Image(systemName: "chevron.right").foregroundStyle(Theme.textFaint)
        }
        .card(padding: 14)
        .contentShape(Rectangle())
    }
}
