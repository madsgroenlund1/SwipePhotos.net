import Foundation

struct APIError: LocalizedError {
    let message: String
    var status: Int = 0
    var errorDescription: String? { message }
}

/// Builds multipart/form-data bodies in memory (photos are ≤ ~400 KB each).
struct MultipartBody {
    let boundary = "Boundary-\(UUID().uuidString)"
    private var data = Data()

    var contentType: String { "multipart/form-data; boundary=\(boundary)" }

    mutating func addField(_ name: String, _ value: String) {
        data.append("--\(boundary)\r\n".data(using: .utf8)!)
        data.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
        data.append("\(value)\r\n".data(using: .utf8)!)
    }

    mutating func addFile(_ name: String, fileName: String, mimeType: String = "image/jpeg", bytes: Data) {
        data.append("--\(boundary)\r\n".data(using: .utf8)!)
        data.append("Content-Disposition: form-data; name=\"\(name)\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        data.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        data.append(bytes)
        data.append("\r\n".data(using: .utf8)!)
    }

    func finalized() -> Data {
        var out = data
        out.append("--\(boundary)--\r\n".data(using: .utf8)!)
        return out
    }
}

/// One line of the server's NDJSON progress streams (/api/generate/preview, /api/refine/preview).
struct StreamEvent: Decodable {
    let status: String
    let urls: [String]?
    let url: String?
    let error: String?
}

final class APIClient {
    static let shared = APIClient()

    /// Set by AuthSession (called when the server says the session is invalid).
    var onUnauthorized: () -> Void = {}

    private let session: URLSession = {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 60
        config.waitsForConnectivity = true
        return URLSession(configuration: config)
    }()

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        let withFraction = ISO8601DateFormatter()
        withFraction.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let plain = ISO8601DateFormatter()
        plain.formatOptions = [.withInternetDateTime]
        d.dateDecodingStrategy = .custom { decoder in
            let s = try decoder.singleValueContainer().decode(String.self)
            if let date = withFraction.date(from: s) ?? plain.date(from: s) { return date }
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Bad date \(s)"))
        }
        return d
    }()

    // MARK: Requests

    private func makeRequest(_ method: String, _ path: String, timeout: TimeInterval? = nil) -> URLRequest {
        var request = URLRequest(url: Config.baseURL.appendingPathComponent(path))
        request.httpMethod = method
        if let timeout { request.timeoutInterval = timeout }
        if let token = TokenStore.shared.token { request.setValue(token, forHTTPHeaderField: "X-SwipePhotos-Token") }
        return request
    }

    private func check(_ data: Data, _ response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse else { throw APIError(message: "No response from server.") }
        guard (200..<300).contains(http.statusCode) else {
            if http.statusCode == 401 { onUnauthorized() }
            let message = (try? JSONDecoder().decode([String: String].self, from: data))?["error"]
            throw APIError(message: message ?? "Something went wrong (\(http.statusCode)). Please try again.", status: http.statusCode)
        }
    }

    private func perform(_ request: URLRequest) async throws -> Data {
        do {
            let (data, response) = try await session.data(for: request)
            try check(data, response)
            return data
        } catch let error as APIError {
            throw error
        } catch let error as URLError where error.code == .cancelled {
            throw error
        } catch {
            throw APIError(message: "Can\u{2019}t reach the server. Check your connection and try again.")
        }
    }

    func get<T: Decodable>(_ path: String, as type: T.Type = T.self) async throws -> T {
        let data = try await perform(makeRequest("GET", path))
        return try decode(data)
    }

    func post<T: Decodable>(_ path: String, json: [String: Any] = [:], as type: T.Type = T.self, timeout: TimeInterval? = nil) async throws -> T {
        var request = makeRequest("POST", path, timeout: timeout)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: json)
        return try decode(try await perform(request))
    }

    func postMultipart<T: Decodable>(_ path: String, body: MultipartBody, as type: T.Type = T.self, timeout: TimeInterval = 120) async throws -> T {
        var request = makeRequest("POST", path, timeout: timeout)
        request.setValue(body.contentType, forHTTPHeaderField: "Content-Type")
        request.httpBody = body.finalized()
        return try decode(try await perform(request))
    }

    private func decode<T: Decodable>(_ data: Data) throws -> T {
        do { return try decoder.decode(T.self, from: data) }
        catch { throw APIError(message: "Unexpected response from the server.") }
    }

    // MARK: Streaming (NDJSON)

    /// POSTs and delivers each JSON line as it arrives. Throws if the server
    /// reports `{"status":"error"}`.
    func stream(_ path: String, contentType: String, body: Data, timeout: TimeInterval = 330,
                onEvent: @MainActor (StreamEvent) -> Void) async throws {
        var request = makeRequest("POST", path, timeout: timeout)
        request.setValue(contentType, forHTTPHeaderField: "Content-Type")
        request.httpBody = body

        let bytes: URLSession.AsyncBytes
        let response: URLResponse
        do {
            (bytes, response) = try await session.bytes(for: request)
        } catch {
            throw APIError(message: "Can\u{2019}t reach the server. Check your connection and try again.")
        }
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APIError(message: "The server is busy. Please try again.")
        }
        do {
            for try await line in bytes.lines where !line.isEmpty {
                guard let event = try? JSONDecoder().decode(StreamEvent.self, from: Data(line.utf8)) else { continue }
                if event.status == "error" { throw APIError(message: event.error ?? "Generation failed. Please try again.") }
                await onEvent(event)
            }
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError(message: "The connection was interrupted. Please try again.")
        }
    }
}
