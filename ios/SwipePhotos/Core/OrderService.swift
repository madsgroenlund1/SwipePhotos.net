import UIKit

/// Server calls for creating, filling and redeeming an order.
enum OrderService {
    /// - mode: "purchase" (will be paid with an In-App Purchase) or
    ///         "subscription" (an active subscription covers it).
    static func createOrder(plan: Plan, style: PhotoStyle, hasTattoos: Bool,
                            previewURL: String?, mode: String) async throws -> String {
        var json: [String: Any] = [
            "packageId": plan.apiId,
            "style": style.rawValue,
            "hasTattoos": hasTattoos,
            "mode": mode,
        ]
        if let previewURL { json["selectedPreviewUrl"] = previewURL }
        let created: OrderCreatedDTO = try await APIClient.shared.post("api/mobile/orders", json: json)
        return created.orderId
    }

    static func upload(photos: [PhotoSlot: PickedPhoto], orderId: String) async throws {
        var body = MultipartBody()
        for slot in PhotoSlot.uploadOrder {
            if let photo = photos[slot] {
                body.addFile("files", fileName: slot.uploadFileName, bytes: photo.jpeg)
            }
        }
        let _: OKDTO = try await APIClient.shared.postMultipart("api/mobile/orders/\(orderId)/photos", body: body)
    }

    static func redeem(orderId: String, jws: String) async throws {
        let _: OKDTO = try await APIClient.shared.post(
            "api/mobile/orders/\(orderId)/iap", json: ["signedTransaction": jws], timeout: 150)
    }

    static func startWithSubscription(orderId: String) async throws {
        let _: OKDTO = try await APIClient.shared.post("api/mobile/orders/\(orderId)/start", timeout: 150)
    }

    static func status(orderId: String) async throws -> OrderStatusDTO {
        try await APIClient.shared.get("api/mobile/orders/\(orderId)")
    }
}

/// A photo the customer picked: a small thumbnail for the UI + the upload-ready JPEG.
struct PickedPhoto: Identifiable {
    let id = UUID()
    let thumbnail: UIImage
    let jpeg: Data
}
