import UIKit

/// A photo the customer picked: a small thumbnail for the UI + the upload-ready JPEG.
struct PickedPhoto: Identifiable {
    let id = UUID()
    let thumbnail: UIImage
    let jpeg: Data
}
