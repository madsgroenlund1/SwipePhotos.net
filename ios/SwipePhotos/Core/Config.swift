import Foundation

/// App-wide constants. Product IDs must match App Store Connect and the
/// server's catalog (src/lib/apple-iap.ts APPLE_PRODUCTS).
enum Config {
    /// The bare domain redirects to www; call www directly.
    static let baseURL = URL(string: "https://www.swipephotos.net")!
    static let supportEmail = "support@swipephotos.net"

    static let termsURL = baseURL.appendingPathComponent("terms")
    static let privacyURL = baseURL.appendingPathComponent("privacy")
    static let appleStandardEULA = URL(string: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")!

    static func sceneImageURL(_ style: PhotoStyle) -> URL {
        baseURL.appendingPathComponent("photos/presets/scene-\(style.rawValue).jpg")
    }

    static func exampleImageURL(_ slot: PhotoSlot) -> URL? {
        guard let name = slot.exampleFile else { return nil }
        return baseURL.appendingPathComponent("photos/upload-examples/\(name)")
    }
}

enum PhotoStyle: String, CaseIterable, Identifiable {
    case restaurant, formal, rooftop, beach
    var id: String { rawValue }
    var title: String {
        switch self {
        case .restaurant: return "Italian Restaurant"
        case .formal:     return "Smart Formal"
        case .rooftop:    return "Rooftop Pool"
        case .beach:      return "Beach Club"
        }
    }
}

enum Plan: String, CaseIterable, Identifiable {
    case starter, premium, pro
    var id: String { rawValue }

    /// The id the server/Stripe use for this plan.
    var apiId: String {
        switch self {
        case .starter: return "starter"
        case .premium: return "popular"
        case .pro:     return "elite"
        }
    }
    var name: String { rawValue.capitalized }
    var photosPerMonth: Int {
        switch self {
        case .starter: return 5
        case .premium: return 15
        case .pro:     return 45
        }
    }
    var isPopular: Bool { self == .premium }
    var features: [String] {
        switch self {
        case .starter: return ["5 AI photos / month", "2 style presets", "~60 min delivery"]
        case .premium: return ["15 AI photos / month", "All 40 templates", "~30 min priority delivery"]
        case .pro:     return ["45 AI photos / month", "All 40 templates", "~30 min priority delivery"]
        }
    }

    static func fromAPI(_ id: String?) -> Plan? { allCases.first { $0.apiId == id } }
}

enum Billing: String, CaseIterable, Identifiable {
    case monthly, yearly
    var id: String { rawValue }
}

extension Plan {
    func productID(_ billing: Billing) -> String { "net.swipephotos.app.\(rawValue).\(billing.rawValue)" }
    static var allProductIDs: [String] {
        allCases.flatMap { plan in Billing.allCases.map { plan.productID($0) } }
    }
}

enum PhotoSlot: String, CaseIterable, Identifiable {
    case body, left, front, right, tattoo
    var id: String { rawValue }

    var title: String {
        switch self {
        case .body:   return "Full body"
        case .left:   return "Left angle"
        case .front:  return "Front"
        case .right:  return "Right angle"
        case .tattoo: return "Tattoo"
        }
    }
    var hint: String {
        switch self {
        case .body:   return "Head to fingertips"
        case .left:   return "Turn your head slightly left"
        case .front:  return "Face the camera directly"
        case .right:  return "Turn your head slightly right"
        case .tattoo: return "A clear photo of your tattoo"
        }
    }
    /// File on swipephotos.net/photos/upload-examples
    var exampleFile: String? {
        switch self {
        case .body:   return "body.jpg"
        case .left:   return "left-v2.jpg"
        case .front:  return "front.jpg"
        case .right:  return "right-v2.jpg"
        case .tattoo: return "tattoo-example.jpg"
        }
    }
    /// The server looks for this exact file name to find the tattoo reference.
    var uploadFileName: String { self == .tattoo ? "tattoo-reference.jpg" : "\(rawValue).jpg" }
    /// Upload order expected by the generator (front first).
    static let uploadOrder: [PhotoSlot] = [.front, .left, .right, .body, .tattoo]
}
