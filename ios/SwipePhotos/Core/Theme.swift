import SwiftUI

extension Color {
    init(hex: UInt32, opacity: Double = 1) {
        self.init(.sRGB,
                  red: Double((hex >> 16) & 0xFF) / 255,
                  green: Double((hex >> 8) & 0xFF) / 255,
                  blue: Double(hex & 0xFF) / 255,
                  opacity: opacity)
    }
}

/// Design tokens mirrored from swipephotos.net (globals.css + Tailwind palette).
enum Theme {
    static let bg            = Color(hex: 0x0A0A0A)
    static let card          = Color(hex: 0x111111)
    static let border        = Color.white.opacity(0.09)
    static let blue600       = Color(hex: 0x2563EB)
    static let blue500       = Color(hex: 0x3B82F6)
    static let blue400       = Color(hex: 0x60A5FA)
    static let textSecondary = Color(hex: 0xA1A1AA)
    static let textMuted     = Color(hex: 0x71717A)
    static let textFaint     = Color(hex: 0x52525B)
    static let green         = Color(hex: 0x22C55E)
    static let red           = Color(hex: 0xEF4444)
    static let amber         = Color(hex: 0xF59E0B)
    static let radius: CGFloat = 16
}

struct PrimaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(isEnabled ? Color.white : Theme.textFaint)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: Theme.radius, style: .continuous)
                    .fill(isEnabled ? Theme.blue600 : Color.white.opacity(0.05))
            )
            .shadow(color: isEnabled ? Theme.blue500.opacity(0.35) : .clear, radius: 16, y: 6)
            .opacity(configuration.isPressed ? 0.85 : 1)
            .scaleEffect(configuration.isPressed ? 0.99 : 1)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16, weight: .semibold))
            .foregroundStyle(Color.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .background(
                RoundedRectangle(cornerRadius: Theme.radius, style: .continuous)
                    .fill(Color.white.opacity(0.06))
            )
            .overlay(
                RoundedRectangle(cornerRadius: Theme.radius, style: .continuous)
                    .stroke(Theme.border, lineWidth: 1)
            )
            .opacity(configuration.isPressed ? 0.8 : 1)
    }
}

struct DestructiveButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16, weight: .semibold))
            .foregroundStyle(Theme.red)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .background(
                RoundedRectangle(cornerRadius: Theme.radius, style: .continuous)
                    .fill(Theme.red.opacity(0.10))
            )
            .overlay(
                RoundedRectangle(cornerRadius: Theme.radius, style: .continuous)
                    .stroke(Theme.red.opacity(0.25), lineWidth: 1)
            )
            .opacity(configuration.isPressed ? 0.8 : 1)
    }
}

extension View {
    /// Dark rounded card with a hairline border (the site's `bg-[#111] border-white/10`).
    func card(padding: CGFloat = 16, radius: CGFloat = 20) -> some View {
        self
            .padding(padding)
            .background(Theme.card, in: RoundedRectangle(cornerRadius: radius, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: radius, style: .continuous).stroke(Theme.border, lineWidth: 1))
    }
}

/// "SwipePhotos" in white + ".net" in blue, like the site's navbar.
struct Wordmark: View {
    var size: CGFloat = 22
    var body: some View {
        HStack(spacing: 0) {
            Text("SwipePhotos").foregroundStyle(.white)
            Text(".net").foregroundStyle(Theme.blue500)
        }
        .font(.system(size: size, weight: .bold))
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("SwipePhotos.net")
    }
}

/// Near-black page background with the site's soft blue glow at the top.
struct ScreenBackground: View {
    var body: some View {
        ZStack {
            Theme.bg
            RadialGradient(colors: [Theme.blue600.opacity(0.16), .clear],
                           center: .top, startRadius: 0, endRadius: 420)
        }
        .ignoresSafeArea()
    }
}

struct Eyebrow: View {
    let text: String
    var body: some View {
        Text(text.uppercased())
            .font(.system(size: 12, weight: .semibold))
            .tracking(1.6)
            .foregroundStyle(Theme.textMuted)
    }
}

struct Badge: View {
    let text: String
    var tint: Color = Theme.blue500
    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(tint)
            .padding(.horizontal, 9)
            .padding(.vertical, 4)
            .background(tint.opacity(0.14), in: Capsule())
            .overlay(Capsule().stroke(tint.opacity(0.25), lineWidth: 1))
    }
}

/// AsyncImage with a dark placeholder and a failure state.
struct RemoteImage: View {
    let url: URL?
    var contentMode: ContentMode = .fill

    var body: some View {
        AsyncImage(url: url) { phase in
            switch phase {
            case .success(let image):
                image.resizable().aspectRatio(contentMode: contentMode)
            case .failure:
                ZStack {
                    Color.white.opacity(0.05)
                    Image(systemName: "photo").foregroundStyle(Theme.textFaint)
                }
            default:
                Color.white.opacity(0.05).overlay(ProgressView().tint(Theme.textMuted))
            }
        }
    }
}

/// Shows a thin error banner.
struct ErrorBanner: View {
    let message: String
    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(Theme.red)
            Text(message).font(.system(size: 14)).foregroundStyle(Color.white.opacity(0.9))
            Spacer(minLength: 0)
        }
        .padding(14)
        .background(Theme.red.opacity(0.10), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Theme.red.opacity(0.25), lineWidth: 1))
    }
}
