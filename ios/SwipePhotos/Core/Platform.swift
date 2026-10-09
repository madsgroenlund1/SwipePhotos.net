import SwiftUI
import UIKit
import Photos
import SafariServices

// MARK: Camera

struct CameraPicker: UIViewControllerRepresentable {
    let onImage: (UIImage) -> Void
    @Environment(\.dismiss) private var dismiss

    static var isAvailable: Bool { UIImagePickerController.isSourceTypeAvailable(.camera) }

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    func makeCoordinator() -> Coordinator { Coordinator(self) }

    final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: CameraPicker
        init(_ parent: CameraPicker) { self.parent = parent }
        func imagePickerController(_ picker: UIImagePickerController,
                                   didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let image = info[.originalImage] as? UIImage { parent.onImage(image) }
            parent.dismiss()
        }
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) { parent.dismiss() }
    }
}

// MARK: In-app browser (Terms, Privacy)

struct WebLink: Identifiable {
    let url: URL
    var id: String { url.absoluteString }
}

struct SafariView: UIViewControllerRepresentable {
    let url: URL
    func makeUIViewController(context: Context) -> SFSafariViewController {
        let controller = SFSafariViewController(url: url)
        controller.preferredBarTintColor = UIColor(Theme.bg)
        controller.preferredControlTintColor = UIColor(Theme.blue500)
        return controller
    }
    func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}
}

// MARK: Share sheet

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

// MARK: Saving to the photo library

enum PhotoLibrary {
    enum SaveError: LocalizedError {
        case denied, downloadFailed
        var errorDescription: String? {
            switch self {
            case .denied:         return "Allow SwipePhotos to add photos in Settings \u{2192} Privacy \u{2192} Photos."
            case .downloadFailed: return "A photo could not be downloaded. Check your connection and try again."
            }
        }
    }

    static func download(_ urlString: String) async throws -> UIImage {
        guard let url = URL(string: urlString),
              let (data, response) = try? await URLSession.shared.data(from: url),
              (response as? HTTPURLResponse)?.statusCode == 200,
              let image = UIImage(data: data) else { throw SaveError.downloadFailed }
        return image
    }

    /// Adds the photos to the user's library (add-only permission).
    static func save(urls: [String]) async throws -> Int {
        let status = await PHPhotoLibrary.requestAuthorization(for: .addOnly)
        guard status == .authorized || status == .limited else { throw SaveError.denied }
        var images: [UIImage] = []
        for url in urls { images.append(try await download(url)) }
        try await PHPhotoLibrary.shared().performChanges {
            for image in images { PHAssetChangeRequest.creationRequestForAsset(from: image) }
        }
        return images.count
    }
}

// MARK: Keep working briefly when the app is backgrounded

enum BackgroundTime {
    /// iOS grants roughly 30 s after the user leaves the app — enough to ride out a quick app switch.
    @MainActor
    static func run<T>(_ work: () async throws -> T) async rethrows -> T {
        var identifier = UIBackgroundTaskIdentifier.invalid
        identifier = UIApplication.shared.beginBackgroundTask(withName: "swipephotos-long-request") {
            UIApplication.shared.endBackgroundTask(identifier)
            identifier = .invalid
        }
        defer {
            if identifier != .invalid { UIApplication.shared.endBackgroundTask(identifier) }
        }
        return try await work()
    }
}

// MARK: Misc

extension Array {
    subscript(safe index: Int) -> Element? { indices.contains(index) ? self[index] : nil }
}

extension Date {
    var shortFormatted: String { formatted(date: .abbreviated, time: .omitted) }
}
