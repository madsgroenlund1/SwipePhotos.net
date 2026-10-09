import SwiftUI

struct OrderDetailView: View {
    let orderId: String
    @Environment(AppModel.self) private var app
    @Environment(AuthSession.self) private var session

    @State private var viewerIndex: Int?
    @State private var saving = false
    @State private var toast: String?

    private var order: OrderDTO? { app.orders.first { $0.id == orderId } }
    private let columns = [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)]

    var body: some View {
        ZStack {
            ScreenBackground()
            if let order {
                content(order)
            } else {
                ProgressView().tint(Theme.textMuted)
            }
        }
        .navigationTitle(order.map { "\($0.planName) set" } ?? "Photos")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Theme.bg, for: .navigationBar)
        .fullScreenCover(item: Binding(get: { viewerIndex.map { ViewerStart(index: $0) } }, set: { viewerIndex = $0?.index })) { start in
            PhotoViewer(urls: order?.photos ?? [], startIndex: start.index)
        }
        .overlay(alignment: .bottom) {
            if let toast {
                Text(toast)
                    .font(.system(size: 14, weight: .semibold))
                    .padding(.horizontal, 16).padding(.vertical, 12)
                    .background(.ultraThinMaterial, in: Capsule())
                    .padding(.bottom, 24)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.easeInOut, value: toast)
    }

    @ViewBuilder private func content(_ order: OrderDTO) -> some View {
        switch order.state {
        case .ready:
            ScrollView {
                VStack(spacing: 16) {
                    LazyVGrid(columns: columns, spacing: 8) {
                        ForEach(Array(order.photos.enumerated()), id: \.offset) { index, url in
                            Button { viewerIndex = index } label: {
                                Color.clear
                                    .aspectRatio(3.0 / 4.0, contentMode: .fit)
                                    .overlay(RemoteImage(url: URL(string: url)))
                                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Photo \(index + 1) of \(order.photos.count)")
                        }
                    }
                    Button { Task { await saveAll(order) } } label: {
                        if saving { ProgressView().tint(.white) }
                        else { Label("Save all to Photos", systemImage: "square.and.arrow.down") }
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .disabled(saving)
                    Text("AI-generated photos. If one isn\u{2019}t right, contact support and we\u{2019}ll regenerate it free.")
                        .font(.system(size: 12)).foregroundStyle(Theme.textFaint).multilineTextAlignment(.center)
                }
                .padding(16)
            }
        case .failed:
            VStack(spacing: 14) {
                Image(systemName: "exclamationmark.triangle.fill").font(.system(size: 48)).foregroundStyle(Theme.amber)
                Text("Something went wrong").font(.system(size: 22, weight: .bold))
                Text("We couldn\u{2019}t finish this set. Contact support and we\u{2019}ll make it right.")
                    .font(.system(size: 15)).foregroundStyle(Theme.textSecondary).multilineTextAlignment(.center)
                Link(destination: URL(string: "mailto:\(Config.supportEmail)?subject=Order%20\(order.id.suffix(8).uppercased())")!) {
                    Text("Contact support")
                }
                .buttonStyle(PrimaryButtonStyle())
            }
            .padding(24)
        default:
            OrderProgressView(orderId: order.id) { _ in
                Task { await app.refresh(session: session) }
            }
        }
    }

    private func saveAll(_ order: OrderDTO) async {
        saving = true
        defer { saving = false }
        do {
            let count = try await PhotoLibrary.save(urls: order.photos)
            show("Saved \(count) photos to your library")
        } catch {
            show((error as? LocalizedError)?.errorDescription ?? "Couldn\u{2019}t save the photos.")
        }
    }

    private func show(_ message: String) {
        toast = message
        Task {
            try? await Task.sleep(for: .seconds(3))
            if toast == message { toast = nil }
        }
    }

    private struct ViewerStart: Identifiable { let index: Int; var id: Int { index } }
}

// MARK: Full-screen viewer

struct PhotoViewer: View {
    let urls: [String]
    let startIndex: Int
    @Environment(\.dismiss) private var dismiss

    @State private var index = 0
    @State private var message: String?
    @State private var shareImage: ShareItem?
    @State private var busy = false

    private struct ShareItem: Identifiable { let id = UUID(); let image: UIImage }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            TabView(selection: $index) {
                ForEach(Array(urls.enumerated()), id: \.offset) { i, url in
                    RemoteImage(url: URL(string: url), contentMode: .fit)
                        .tag(i)
                        .padding(.vertical, 60)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .ignoresSafeArea()

            VStack {
                HStack {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 15, weight: .semibold))
                            .frame(width: 38, height: 38)
                            .background(.ultraThinMaterial, in: Circle())
                    }
                    .accessibilityLabel("Close")
                    Spacer()
                    Text("\(index + 1) / \(urls.count)").font(.system(size: 14, weight: .semibold)).foregroundStyle(.white.opacity(0.8))
                    Spacer()
                    Color.clear.frame(width: 38, height: 38)
                }
                .padding(.horizontal, 16)
                Spacer()
                HStack(spacing: 12) {
                    Button { Task { await save() } } label: { Label("Save", systemImage: "square.and.arrow.down") }
                        .buttonStyle(SecondaryButtonStyle())
                    Button { Task { await share() } } label: { Label("Share", systemImage: "square.and.arrow.up") }
                        .buttonStyle(SecondaryButtonStyle())
                }
                .disabled(busy)
                .padding(.horizontal, 20)
                .padding(.bottom, 12)
            }
            .foregroundStyle(.white)

            if let message {
                Text(message)
                    .font(.system(size: 14, weight: .semibold))
                    .padding(.horizontal, 16).padding(.vertical, 12)
                    .background(.ultraThinMaterial, in: Capsule())
                    .frame(maxHeight: .infinity, alignment: .center)
            }
        }
        .onAppear { index = startIndex }
        .sheet(item: $shareImage) { ShareSheet(items: [$0.image]) }
        .preferredColorScheme(.dark)
    }

    private func save() async {
        guard let url = urls[safe: index] else { return }
        busy = true
        defer { busy = false }
        do {
            _ = try await PhotoLibrary.save(urls: [url])
            flash("Saved to your library")
        } catch {
            flash((error as? LocalizedError)?.errorDescription ?? "Couldn\u{2019}t save the photo.")
        }
    }

    private func share() async {
        guard let url = urls[safe: index] else { return }
        busy = true
        defer { busy = false }
        if let image = try? await PhotoLibrary.download(url) { shareImage = ShareItem(image: image) }
        else { flash("Couldn\u{2019}t load the photo.") }
    }

    private func flash(_ text: String) {
        message = text
        Task {
            try? await Task.sleep(for: .seconds(2.2))
            if message == text { message = nil }
        }
    }
}
