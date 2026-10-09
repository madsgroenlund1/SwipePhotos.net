import UIKit

enum ImageProcessing {
    static let minBytes = 15_000
    static let maxBytes = 25_000_000

    /// Same pipeline as the website: longest side ≤ 1024 px, JPEG quality 0.85.
    static func prepareForUpload(_ image: UIImage, maxSide: CGFloat = 1024) -> Data? {
        let size = image.size
        let longest = max(size.width, size.height)
        let scale = longest > maxSide ? maxSide / longest : 1
        let target = CGSize(width: (size.width * scale).rounded(), height: (size.height * scale).rounded())

        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        format.opaque = true
        let renderer = UIGraphicsImageRenderer(size: target, format: format)
        let resized = renderer.image { _ in image.draw(in: CGRect(origin: .zero, size: target)) }
        return resized.jpegData(compressionQuality: 0.85)
    }

    /// Loads image data from a PhotosPicker item/camera and fixes orientation.
    static func image(from data: Data) -> UIImage? {
        guard let image = UIImage(data: data) else { return nil }
        return normalized(image)
    }

    static func normalized(_ image: UIImage) -> UIImage {
        guard image.imageOrientation != .up else { return image }
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = image.scale
        return UIGraphicsImageRenderer(size: image.size, format: format).image { _ in
            image.draw(at: .zero)
        }
    }
}
