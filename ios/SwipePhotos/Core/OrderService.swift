import Foundation

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

    /// `photos` maps each slot to its upload-ready JPEG bytes.
    static func upload(photos: [PhotoSlot: Data], orderId: String) async throws {
        var body = MultipartBody()
        for slot in PhotoSlot.uploadOrder {
            if let jpeg = photos[slot] {
                body.addFile("files", fileName: slot.uploadFileName, bytes: jpeg)
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
