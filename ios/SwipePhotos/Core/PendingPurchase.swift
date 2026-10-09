import Foundation

/// A purchase that has been paid for but not yet redeemed with our server.
/// Persisted so a crash/offline moment can never cost a customer their photos.
struct PendingPurchase: Codable {
    var orderId: String
    var jws: String?
}

enum PendingPurchaseStore {
    private static let key = "sw_pending_purchase"

    static func load() -> PendingPurchase? {
        guard let data = UserDefaults.standard.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(PendingPurchase.self, from: data)
    }
    static func save(_ pending: PendingPurchase) {
        if let data = try? JSONEncoder().encode(pending) { UserDefaults.standard.set(data, forKey: key) }
    }
    static func clear() { UserDefaults.standard.removeObject(forKey: key) }
}
