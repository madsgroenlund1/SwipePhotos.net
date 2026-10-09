import UIKit
import Observation
import StoreKit

enum OnboardingStep: Int {
    case style, consent, photos, generating, pick, refining, paywall, processing
}

/// All state of the "free preview → plan → photos" flow.
@Observable @MainActor
final class OnboardingModel {
    // Choices
    var style: PhotoStyle = .restaurant
    var hasTattoos = false
    var photos: [PhotoSlot: PickedPhoto] = [:]
    var agreedToProcessing = false
    var confirmedAdult = false
    var plan: Plan = .premium
    var billing: Billing = .monthly

    // Progress
    var step: OnboardingStep = .style
    var statusText = ""
    var progress = 0.0
    var error: String?
    var isWorking = false

    // Results
    var previewURLs: [String] = []
    var pickedIndex = 0
    var refinedURL: String?
    var processingOrderId: String?

    // Checkout bookkeeping (lets a cancelled purchase be retried without re-uploading)
    private var pendingOrderId: String?
    private var pendingOrderPlan: Plan?
    private var photosUploaded = false

    var requiredSlots: [PhotoSlot] { hasTattoos ? [.body, .left, .front, .right, .tattoo] : [.body, .left, .front, .right] }
    var photosComplete: Bool { requiredSlots.allSatisfy { photos[$0] != nil } }
    var displayPreviewURL: String? { refinedURL ?? previewURLs[safe: pickedIndex] }

    static let previewLabels = ["Bad Boy", "Gentleman"]

    // MARK: Photos

    /// Compresses a picked/taken photo (off the main thread) and stores it for `slot`.
    func setPhoto(_ image: UIImage, slot: PhotoSlot) async {
        let prepared: (jpeg: Data, thumb: UIImage)? = await Task.detached(priority: .userInitiated) {
            guard let jpeg = ImageProcessing.prepareForUpload(image) else { return nil }
            let thumb = UIImage(data: jpeg)?.preparingThumbnail(of: CGSize(width: 480, height: 480)) ?? image
            return (jpeg, thumb)
        }.value
        guard let prepared, prepared.jpeg.count >= ImageProcessing.minBytes else {
            error = "That photo is too small or unclear. Please choose a sharper one."
            return
        }
        error = nil
        photos[slot] = PickedPhoto(thumbnail: prepared.thumb, jpeg: prepared.jpeg)
    }

    // MARK: Free preview

    func generatePreviews() async {
        guard photosComplete else { return }
        error = nil
        previewURLs = []
        refinedURL = nil
        step = .generating
        progress = 0.04
        statusText = "Validating photos"

        var body = MultipartBody()
        for slot in [PhotoSlot.front, .left, .right, .body] {
            if let photo = photos[slot] { body.addFile(slot.rawValue, fileName: slot.uploadFileName, bytes: photo.jpeg) }
        }
        if hasTattoos, let tattoo = photos[.tattoo] {
            body.addField("hasTattoos", "true")
            body.addFile("tattooPhoto", fileName: PhotoSlot.tattoo.uploadFileName, bytes: tattoo.jpeg)
        }
        body.addField("style", style.rawValue)
        let contentType = body.contentType
        let payload = body.finalized()

        do {
            try await BackgroundTime.run {
                try await APIClient.shared.stream("api/generate/preview", contentType: contentType, body: payload) { [weak self] event in
                    self?.handlePreview(event)
                }
            }
            if previewURLs.count >= 2 {
                pickedIndex = 0
                step = .pick
            } else {
                throw APIError(message: "We couldn\u{2019}t finish your previews. Please try again.")
            }
        } catch {
            self.error = (error as? APIError)?.message ?? error.localizedDescription
            step = .photos
        }
    }

    private func handlePreview(_ event: StreamEvent) {
        switch event.status {
        case "uploading": statusText = "Validating photos";            progress = 0.10
        case "preparing": statusText = "Preparing your setting";       progress = 0.20
        case "gen_1":     statusText = "Generating preview 1 of 2";    progress = 0.35
        case "gen_2":     statusText = "Generating preview 2 of 2";    progress = 0.65
        case "checking":  statusText = "Checking quality";             progress = 0.85
        case "saving":    statusText = "Saving previews";              progress = 0.95
        case "done":
            if let urls = event.urls { previewURLs = urls }
            progress = 1
        default: break
        }
    }

    // MARK: Polish step (server-side blending / skin-tone / artifact pass)

    func refine() async {
        guard let url = previewURLs[safe: pickedIndex] else { return }
        error = nil
        refinedURL = nil
        step = .refining
        progress = 0.05
        statusText = "Preparing selected preview"

        do {
            let payload = try JSONSerialization.data(withJSONObject: ["previewUrl": url])
            try await BackgroundTime.run {
                try await APIClient.shared.stream("api/refine/preview", contentType: "application/json",
                                                  body: payload, timeout: 150) { [weak self] event in
                    self?.handleRefine(event)
                }
            }
        } catch {
            // The polish pass is optional — fall back to the preview the customer picked.
            refinedURL = nil
        }
        step = .paywall
    }

    private func handleRefine(_ event: StreamEvent) {
        switch event.status {
        case "preparing":          statusText = "Preparing selected preview";       progress = 0.08
        case "checking_alignment": statusText = "Checking face alignment";          progress = 0.22
        case "blending":           statusText = "Improving face and neck blending"; progress = 0.38
        case "skin_tone":          statusText = "Matching skin tone and lighting";  progress = 0.52
        case "texture":            statusText = "Preserving natural skin texture";  progress = 0.66
        case "artifacts":          statusText = "Correcting minor visual artifacts"; progress = 0.78
        case "quality":            statusText = "Optimizing image quality";         progress = 0.88
        case "saving":             statusText = "Saving final preview";             progress = 0.95
        case "done":
            refinedURL = event.url
            statusText = "Ready"
            progress = 1
        default: break
        }
    }

    // MARK: Checkout

    enum CheckoutOutcome { case started, cancelled, awaitingApproval }

    /// Creates the order, uploads the photos, then either starts it on an active
    /// subscription or buys the chosen plan with an In-App Purchase.
    func checkout(product: Product?, entitlement: EntitlementDTO, store: StoreManager) async throws -> CheckoutOutcome {
        isWorking = true
        defer { isWorking = false }

        // Active subscriber with an unused set → no new payment.
        if entitlement.active, entitlement.canStartSet, let activePlan = entitlement.plan {
            let orderId = try await OrderService.createOrder(plan: activePlan, style: style, hasTattoos: hasTattoos,
                                                             previewURL: displayPreviewURL, mode: "subscription")
            try await OrderService.upload(photos: photos, orderId: orderId)
            try await OrderService.startWithSubscription(orderId: orderId)
            processingOrderId = orderId
            step = .processing
            return .started
        }

        guard let product else { throw APIError(message: "Plans are not available right now. Please try again in a moment.") }

        // Reuse the pending order if the customer is retrying the same plan.
        if pendingOrderPlan != plan { pendingOrderId = nil; photosUploaded = false }
        let orderId: String
        if let existing = pendingOrderId {
            orderId = existing
        } else {
            orderId = try await OrderService.createOrder(plan: plan, style: style, hasTattoos: hasTattoos,
                                                         previewURL: displayPreviewURL, mode: "purchase")
            pendingOrderId = orderId
            pendingOrderPlan = plan
            photosUploaded = false
        }
        if !photosUploaded {
            try await OrderService.upload(photos: photos, orderId: orderId)
            photosUploaded = true
        }

        switch try await store.purchase(product, orderId: orderId) {
        case .cancelled:
            return .cancelled
        case .pending:
            PendingPurchaseStore.save(PendingPurchase(orderId: orderId, jws: nil))
            return .awaitingApproval
        case .success(let jws):
            // Persist BEFORE the network call: a paid purchase must never be lost.
            PendingPurchaseStore.save(PendingPurchase(orderId: orderId, jws: jws))
            try await OrderService.redeem(orderId: orderId, jws: jws)
            PendingPurchaseStore.clear()
            await store.finishTransactions(forAccountToken: orderId)
            processingOrderId = orderId
            pendingOrderId = nil
            step = .processing
            return .started
        }
    }
}
