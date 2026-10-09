import SwiftUI

/// Polls an order until it leaves the "in progress" states. Each poll also
/// advances the server-side pipeline, so just keeping this screen open is enough.
struct OrderProgressView: View {
    let orderId: String
    var onFinished: (OrderStatusDTO) -> Void

    @State private var status: OrderStatusDTO?
    @State private var tick = 0

    private let messages = [
        "Matching your face and features\u{2026}",
        "Placing you in the scene\u{2026}",
        "Checking every photo for quality\u{2026}",
        "Polishing skin tone and lighting\u{2026}",
        "Almost there\u{2026}",
    ]

    var body: some View {
        VStack(spacing: 22) {
            ZStack {
                Circle().stroke(Color.white.opacity(0.08), lineWidth: 8).frame(width: 120, height: 120)
                ProgressView().scaleEffect(1.6).tint(Theme.blue500)
            }
            .shadow(color: Theme.blue500.opacity(0.3), radius: 22)
            Text("Creating your photos").font(.system(size: 24, weight: .bold))
            Text(messages[tick % messages.count])
                .font(.system(size: 15)).foregroundStyle(Theme.blue400)
                .animation(.easeInOut, value: tick)
            Text("This usually takes 30\u{2013}60 minutes. You can close the app \u{2014} we\u{2019}ll e-mail you when your photos are ready.")
                .font(.system(size: 14))
                .foregroundStyle(Theme.textMuted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
        }
        .frame(maxWidth: .infinity)
        .task { await poll() }
    }

    private func poll() async {
        while !Task.isCancelled {
            do {
                let latest = try await OrderService.status(orderId: orderId)
                status = latest
                if !latest.state.isInProgress {
                    onFinished(latest)
                    return
                }
            } catch let error as APIError where error.status == 401 || error.status == 404 {
                return
            } catch {
                // Transient network problem — keep polling.
            }
            tick += 1
            do { try await Task.sleep(for: .seconds(8)) } catch { return }
        }
    }
}

/// Last step of the onboarding flow.
struct FlowProcessingView: View {
    @Environment(OnboardingModel.self) private var model
    @Environment(AppModel.self) private var app
    @Environment(AuthSession.self) private var session
    let onClose: () -> Void

    @State private var finished: OrderStatusDTO?

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            if let finished {
                if finished.state == .ready {
                    Image(systemName: "checkmark.circle.fill").font(.system(size: 64)).foregroundStyle(Theme.green)
                    Text("Your photos are ready!").font(.system(size: 26, weight: .bold))
                    Text("\(finished.photos.count) photos are waiting for you.")
                        .font(.system(size: 16)).foregroundStyle(Theme.textSecondary)
                } else {
                    Image(systemName: "exclamationmark.triangle.fill").font(.system(size: 56)).foregroundStyle(Theme.amber)
                    Text("Something went wrong").font(.system(size: 26, weight: .bold))
                    Text("Please contact support and we\u{2019}ll make it right.")
                        .font(.system(size: 16)).foregroundStyle(Theme.textSecondary)
                }
            } else if let orderId = model.processingOrderId {
                OrderProgressView(orderId: orderId) { result in
                    finished = result
                    Task { await app.refresh(session: session) }
                }
            }
            Spacer()
            Button {
                app.selectedTab = .photos
                onClose()
            } label: {
                Text(finished?.state == .ready ? "View my photos" : "Done")
            }
            .buttonStyle(PrimaryButtonStyle())
            .padding(.horizontal, 20)
            .padding(.bottom, 12)
        }
        .padding(.horizontal, 20)
    }
}
