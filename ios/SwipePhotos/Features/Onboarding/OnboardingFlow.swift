import SwiftUI

/// Container for the whole "free preview → plan → photos" journey.
struct OnboardingFlow: View {
    @Environment(AppModel.self) private var app
    @Environment(\.dismiss) private var dismiss
    @State private var model = OnboardingModel()
    @State private var confirmClose = false

    private var canGoBack: Bool {
        switch model.step {
        case .consent, .photos, .paywall: return true
        default: return false
        }
    }
    private var isBusy: Bool { model.step == .generating || model.step == .refining || model.isWorking }

    var body: some View {
        ZStack {
            ScreenBackground()
            VStack(spacing: 0) {
                topBar
                Group {
                    switch model.step {
                    case .style:      StyleStep()
                    case .consent:    ConsentStep()
                    case .photos:     PhotosStep()
                    case .generating: GeneratingStep()
                    case .pick:       PickStep()
                    case .refining:   RefiningStep()
                    case .paywall:    PaywallView()
                    case .processing: FlowProcessingView(onClose: { dismiss() })
                    }
                }
                .transition(.opacity)
            }
        }
        .environment(model)
        .animation(.easeInOut(duration: 0.2), value: model.step)
        .interactiveDismissDisabled(true)
        .confirmationDialog("Leave without finishing?", isPresented: $confirmClose, titleVisibility: .visible) {
            Button("Leave", role: .destructive) { dismiss() }
            Button("Keep going", role: .cancel) {}
        } message: {
            Text("Your photos and preview won\u{2019}t be saved.")
        }
    }

    private var topBar: some View {
        HStack(spacing: 12) {
            if canGoBack && !isBusy {
                Button { goBack() } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 15, weight: .semibold))
                        .frame(width: 36, height: 36)
                        .background(Color.white.opacity(0.08), in: Circle())
                }
                .foregroundStyle(.white)
                .accessibilityLabel("Back")
            } else {
                Color.clear.frame(width: 36, height: 36)
            }

            ProgressView(value: min(1, Double(model.step.rawValue + 1) / 8))
                .tint(Theme.blue500)

            if model.step == .processing {
                Color.clear.frame(width: 36, height: 36)
            } else {
                Button { requestClose() } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 14, weight: .semibold))
                        .frame(width: 36, height: 36)
                        .background(Color.white.opacity(0.08), in: Circle())
                }
                .foregroundStyle(.white)
                .disabled(isBusy)
                .accessibilityLabel("Close")
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 6)
    }

    private func goBack() {
        switch model.step {
        case .consent: model.step = .style
        case .photos:  model.step = .consent
        case .paywall: model.step = .pick
        default: break
        }
    }

    private func requestClose() {
        if model.step == .style || model.photos.isEmpty && model.step != .paywall {
            dismiss()
        } else {
            confirmClose = true
        }
    }
}

/// Shared page chrome for the simple steps.
struct StepScaffold<Content: View, Footer: View>: View {
    let title: String
    var subtitle: String? = nil
    @ViewBuilder var content: Content
    @ViewBuilder var footer: Footer

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(title).font(.system(size: 28, weight: .bold))
                        if let subtitle {
                            Text(subtitle).font(.system(size: 16)).foregroundStyle(Theme.textSecondary).lineSpacing(2)
                        }
                    }
                    content
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, 24)
            }
            VStack(spacing: 10) { footer }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, 12)
                .background(
                    LinearGradient(colors: [Theme.bg.opacity(0), Theme.bg], startPoint: .top, endPoint: .center)
                        .allowsHitTesting(false)
                )
        }
    }
}
