import Foundation
import Observation
import StoreKit

enum AppTab: Hashable { case photos, account }

/// Account data shown across the app (orders + subscription).
@Observable @MainActor
final class AppModel {
    var me: MeResponse?
    var isRefreshing = false
    var loadError: String?
    var showOnboarding = false
    var selectedTab: AppTab = .photos

    var entitlement: EntitlementDTO { me?.entitlement ?? .none }
    var orders: [OrderDTO] { me?.orders ?? [] }

    func refresh(session: AuthSession) async {
        guard session.isSignedIn else { me = nil; return }
        isRefreshing = true
        defer { isRefreshing = false }
        do {
            let response: MeResponse = try await APIClient.shared.get("api/mobile/me")
            me = response
            loadError = nil
            if let token = response.token { session.rotate(token: token) }
        } catch let error as APIError {
            loadError = error.message
        } catch {
            loadError = error.localizedDescription
        }
    }

    func reset() { me = nil; loadError = nil }

    /// Re-sends the user's current StoreKit subscription to the server (renewals, restores).
    func syncPurchases(store: StoreManager, session: AuthSession) async {
        guard session.isSignedIn else { return }
        let signed = await store.currentEntitlementJWS()
        guard !signed.isEmpty else { return }
        let result: SyncDTO? = try? await APIClient.shared.post(
            "api/mobile/iap/sync", json: ["signedTransactions": signed])
        if result != nil { await refresh(session: session) }
    }

    /// Finishes a purchase that was paid but never redeemed (app killed, offline, Ask-to-Buy).
    func redeemPendingPurchase(store: StoreManager, session: AuthSession) async {
        guard session.isSignedIn, var pending = PendingPurchaseStore.load() else { return }
        if pending.jws == nil, let jws = await store.jws(forAccountToken: pending.orderId) {
            pending.jws = jws
            PendingPurchaseStore.save(pending)
        }
        guard let jws = pending.jws else { return }
        do {
            try await OrderService.redeem(orderId: pending.orderId, jws: jws)
            PendingPurchaseStore.clear()
            await store.finishTransactions(forAccountToken: pending.orderId)
            await refresh(session: session)
        } catch let error as APIError where error.status == 404 || error.status == 409 || error.status == 400 {
            // The order is gone or the purchase can never be redeemed — stop retrying.
            PendingPurchaseStore.clear()
        } catch {
            // Network problem: keep it and try again next launch.
        }
    }
}
