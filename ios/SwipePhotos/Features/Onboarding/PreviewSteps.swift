import SwiftUI

/// Big circular progress used while the server is working.
struct ProgressRing: View {
    let progress: Double
    var body: some View {
        ZStack {
            Circle().stroke(Color.white.opacity(0.08), lineWidth: 8)
            Circle()
                .trim(from: 0, to: max(0.03, progress))
                .stroke(Theme.blue500, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.easeInOut(duration: 0.6), value: progress)
            Text("\(Int(progress * 100))%")
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .monospacedDigit()
        }
        .frame(width: 150, height: 150)
        .shadow(color: Theme.blue500.opacity(0.35), radius: 24)
    }
}

// MARK: Generating

struct GeneratingStep: View {
    @Environment(OnboardingModel.self) private var model

    var body: some View {
        VStack(spacing: 28) {
            Spacer()
            ProgressRing(progress: model.progress)
            VStack(spacing: 8) {
                Text("Creating your preview").font(.system(size: 26, weight: .bold))
                Text(model.statusText).font(.system(size: 16)).foregroundStyle(Theme.blue400)
                    .contentTransition(.opacity)
                    .animation(.easeInOut, value: model.statusText)
            }
            Text("This takes about a minute. Please keep the app open.")
                .font(.system(size: 14))
                .foregroundStyle(Theme.textMuted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            Spacer()
            Spacer()
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: Pick favourite

struct PickStep: View {
    @Environment(OnboardingModel.self) private var model

    var body: some View {
        StepScaffold(title: "Pick your favourite!",
                     subtitle: "Two looks, one you. Choose the one you like best.") {
            HStack(spacing: 12) {
                ForEach(Array(model.previewURLs.prefix(2).enumerated()), id: \.offset) { index, url in
                    card(index: index, url: url)
                }
            }
            Text("AI-generated preview. Final results can differ slightly.")
                .font(.system(size: 12))
                .foregroundStyle(Theme.textFaint)
        } footer: {
            Button { Task { await model.refine() } } label: { Text("Continue") }
                .buttonStyle(PrimaryButtonStyle())
        }
    }

    private func card(index: Int, url: String) -> some View {
        let selected = model.pickedIndex == index
        return Button { model.pickedIndex = index } label: {
            VStack(spacing: 8) {
                ZStack(alignment: .topTrailing) {
                    RemoteImage(url: URL(string: url))
                        .aspectRatio(3.0 / 4.0, contentMode: .fill)
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    if selected {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 24))
                            .foregroundStyle(Theme.blue400)
                            .background(Circle().fill(.black))
                            .padding(8)
                    }
                }
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(selected ? Theme.blue500 : Theme.border, lineWidth: selected ? 3 : 1)
                )
                Text(OnboardingModel.previewLabels[safe: index] ?? "Preview \(index + 1)")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(selected ? Theme.blue400 : .white)
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel(OnboardingModel.previewLabels[safe: index] ?? "Preview \(index + 1)")
        .accessibilityAddTraits(selected ? [.isSelected] : [])
    }
}

// MARK: Polish step

struct RefiningStep: View {
    @Environment(OnboardingModel.self) private var model

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            RemoteImage(url: URL(string: model.previewURLs[safe: model.pickedIndex] ?? ""))
                .frame(width: 190, height: 250)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(Theme.border, lineWidth: 1))
                .shadow(color: Theme.blue500.opacity(0.3), radius: 28)
            VStack(spacing: 8) {
                Text("Polishing your photo").font(.system(size: 26, weight: .bold))
                Text(model.statusText).font(.system(size: 16)).foregroundStyle(Theme.blue400)
                    .animation(.easeInOut, value: model.statusText)
            }
            ProgressView(value: model.progress)
                .tint(Theme.blue500)
                .padding(.horizontal, 60)
            Spacer()
            Spacer()
        }
        .frame(maxWidth: .infinity)
    }
}
