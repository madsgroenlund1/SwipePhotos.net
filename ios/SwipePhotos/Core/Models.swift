import Foundation

struct EntitlementDTO: Decodable, Equatable {
    let active: Bool
    let source: String?          // "apple" | "stripe"
    let planId: String?
    let planName: String?
    let photoQuota: Int
    let interval: String?        // "month" | "year"
    let periodStart: Date?
    let periodEnd: Date?
    let willRenew: Bool
    let canStartSet: Bool
    let nextSetAvailableAt: Date?

    static let none = EntitlementDTO(active: false, source: nil, planId: nil, planName: nil, photoQuota: 0,
                                     interval: nil, periodStart: nil, periodEnd: nil, willRenew: false,
                                     canStartSet: false, nextSetAvailableAt: nil)
    var plan: Plan? { Plan.fromAPI(planId) }
}

struct OrderDTO: Decodable, Identifiable, Equatable {
    let id: String
    let packageType: String
    let planName: String
    let status: String
    let createdAt: Date
    let photos: [String]

    var state: OrderState { OrderState(rawValue: status) ?? .processing }
}

enum OrderState: String {
    case pending, processing, generating, training, ready, failed, draft

    var isInProgress: Bool { self == .pending || self == .processing || self == .generating || self == .training || self == .draft }
    var label: String {
        switch self {
        case .ready:  return "Ready"
        case .failed: return "Needs attention"
        default:      return "Creating your photos"
        }
    }
}

struct MeResponse: Decodable {
    let email: String
    let entitlement: EntitlementDTO
    let orders: [OrderDTO]
    let token: String?
}

struct TokenResponse: Decodable {
    let token: String
    let email: String
}

struct OrderStatusDTO: Decodable {
    let id: String
    let status: String
    let planName: String
    let photos: [String]
    var state: OrderState { OrderState(rawValue: status) ?? .processing }
}

struct OrderCreatedDTO: Decodable { let orderId: String }
struct OKDTO: Decodable { let ok: Bool? }
struct SyncDTO: Decodable { let entitlement: EntitlementDTO; let restored: Bool }
