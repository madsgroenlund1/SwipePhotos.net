import Foundation
import Observation
import StoreKit

enum PurchaseOutcome {
    case success(jws: String)
    case cancelled
    case pending
}

/// StoreKit 2: product loading, purchasing and transaction bookkeeping.
@Observable @MainActor
final class StoreManager {
    private(set) var products: [String: Product] = [:]
    private(set) var isLoading = false
    private(set) var loadFailed = false

    @ObservationIgnored private var updatesTask: Task<Void, Never>?

    func product(_ plan: Plan, _ billing: Billing) -> Product? { products[plan.productID(billing)] }

    func loadProducts() async {
        guard !isLoading else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            let loaded = try await Product.products(for: Plan.allProductIDs)
            products = Dictionary(uniqueKeysWithValues: loaded.map { ($0.id, $0) })
            loadFailed = products.isEmpty
        } catch {
            loadFailed = true
        }
    }

    /// Buys `product`, tagging the transaction with the order id so the server can
    /// tie this exact payment to this exact order.
    func purchase(_ product: Product, orderId: String) async throws -> PurchaseOutcome {
        guard let token = UUID(uuidString: orderId) else { throw APIError(message: "Invalid order.") }
        let result = try await product.purchase(options: [.appAccountToken(token)])
        switch result {
        case .success(let verification):
            switch verification {
            case .verified:
                return .success(jws: verification.jwsRepresentation)
            case .unverified:
                throw APIError(message: "Apple could not verify this purchase. Please try again.")
            }
        case .userCancelled:
            return .cancelled
        case .pending:
            return .pending
        @unknown default:
            return .cancelled
        }
    }

    /// "Restore Purchases".
    func restore() async throws {
        try await AppStore.sync()
    }

    func currentEntitlementJWS() async -> [String] {
        var out: [String] = []
        for await result in StoreKit.Transaction.currentEntitlements {
            if case .verified = result { out.append(result.jwsRepresentation) }
        }
        return out
    }

    /// Looks up a transaction made for `accountToken` (an order id).
    func jws(forAccountToken orderId: String) async -> String? {
        guard let token = UUID(uuidString: orderId) else { return nil }
        for await result in StoreKit.Transaction.all {
            if case .verified(let tx) = result, tx.appAccountToken == token { return result.jwsRepresentation }
        }
        return nil
    }

    func finishTransactions(forAccountToken orderId: String) async {
        guard let token = UUID(uuidString: orderId) else { return }
        for await result in StoreKit.Transaction.unfinished {
            if case .verified(let tx) = result, tx.appAccountToken == token { await tx.finish() }
        }
    }

    /// Listens for transactions that arrive outside a purchase flow (renewals,
    /// Ask-to-Buy approvals, purchases from another device).
    func startListening(onTransaction: @escaping @MainActor () async -> Void) {
        updatesTask?.cancel()
        updatesTask = Task {
            for await result in StoreKit.Transaction.updates {
                guard case .verified(let tx) = result else { continue }
                await onTransaction()
                // Orders are finished after redemption; renewals can be finished right away.
                if tx.appAccountToken == nil || PendingPurchaseStore.load() == nil { await tx.finish() }
            }
        }
    }
}
