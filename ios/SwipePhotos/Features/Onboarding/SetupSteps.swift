import SwiftUI
import PhotosUI

// MARK: Step: style

struct StyleStep: View {
    @Environment(OnboardingModel.self) private var model

    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    var body: some View {
        StepScaffold(title: "Pick a style",
                     subtitle: "Choose the setting for your free preview. Paid plans unlock 40+ templates.") {
            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(PhotoStyle.allCases) { style in
                    Button { model.style = style } label: { tile(style) }
                        .buttonStyle(.plain)
                        .accessibilityLabel(style.title)
                        .accessibilityAddTraits(model.style == style ? [.isSelected] : [])
                }
            }
        } footer: {
            Button { model.step = .consent } label: { Text("Continue") }
                .buttonStyle(PrimaryButtonStyle())
        }
    }

    private func tile(_ style: PhotoStyle) -> some View {
        let selected = model.style == style
        return ZStack(alignment: .bottomLeading) {
            RemoteImage(url: Config.sceneImageURL(style))
                .aspectRatio(3.0 / 4.0, contentMode: .fill)
            LinearGradient(colors: [.clear, .black.opacity(0.75)], startPoint: .center, endPoint: .bottom)
            HStack {
                Text(style.title).font(.system(size: 15, weight: .semibold)).foregroundStyle(.white)
                Spacer()
                if selected {
                    Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.blue400)
                }
            }
            .padding(12)
        }
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(selected ? Theme.blue500 : Theme.border, lineWidth: selected ? 2.5 : 1)
        )
    }
}

// MARK: Step: consent (AI processing by a third party + age)

struct ConsentStep: View {
    @Environment(OnboardingModel.self) private var model
    @State private var legal: WebLink?

    var body: some View {
        StepScaffold(title: "Before you upload",
                     subtitle: "Your photos are personal. Here is exactly what happens to them.") {
            VStack(alignment: .leading, spacing: 14) {
                point("sparkles", "AI image generation",
                      "To create your photos, your pictures are sent securely to our AI image provider, fal.ai (USA). They are used only to generate your images \u{2014} never to train AI models.")
                point("lock.shield", "Stored securely",
                      "Your photos and results are stored on our servers in the EU. You can delete everything at any time with Account \u{2192} Delete account.")
                point("person.crop.circle.badge.checkmark", "Only photos of you",
                      "Upload photos of yourself only. The app is for adults (18+).")
            }
            .card()

            VStack(spacing: 12) {
                toggleRow(isOn: Binding(get: { model.agreedToProcessing }, set: { model.agreedToProcessing = $0 })) {
                    Text("I agree that my photos are sent to fal.ai to create my images, as described in the ")
                    + Text("Privacy Policy").foregroundColor(Theme.blue400).underline()
                    + Text(".")
                }
                toggleRow(isOn: Binding(get: { model.confirmedAdult }, set: { model.confirmedAdult = $0 })) {
                    Text("I am 18 or older, and the person in the photos.")
                }
            }

            Button("Read the Privacy Policy") { legal = WebLink(url: Config.privacyURL) }
                .font(.system(size: 14))
                .foregroundStyle(Theme.textSecondary)
        } footer: {
            Button { model.step = .photos } label: { Text("Agree & continue") }
                .buttonStyle(PrimaryButtonStyle())
                .disabled(!(model.agreedToProcessing && model.confirmedAdult))
        }
        .sheet(item: $legal) { SafariView(url: $0.url).ignoresSafeArea() }
    }

    private func point(_ icon: String, _ title: String, _ text: String) -> some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundStyle(Theme.blue400)
                .frame(width: 28)
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(.system(size: 16, weight: .semibold))
                Text(text).font(.system(size: 14)).foregroundStyle(Theme.textSecondary).lineSpacing(2)
            }
        }
    }

    private func toggleRow<L: View>(isOn: Binding<Bool>, @ViewBuilder label: () -> L) -> some View {
        Button { isOn.wrappedValue.toggle() } label: {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: isOn.wrappedValue ? "checkmark.square.fill" : "square")
                    .font(.system(size: 22))
                    .foregroundStyle(isOn.wrappedValue ? Theme.blue500 : Theme.textMuted)
                label()
                    .font(.system(size: 14))
                    .foregroundStyle(Color.white.opacity(0.9))
                    .multilineTextAlignment(.leading)
                Spacer(minLength: 0)
            }
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isOn.wrappedValue ? [.isSelected] : [])
    }
}

// MARK: Step: photos

struct PhotosStep: View {
    @Environment(OnboardingModel.self) private var model

    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
    private let rules = ["Face clearly visible", "Natural lighting", "No sunglasses or hats", "One person only", "No filters"]

    var body: some View {
        StepScaffold(title: "Upload \(model.requiredSlots.count) photos",
                     subtitle: "A relaxed, closed-mouth smile works best. Use the examples as a guide.") {
            VStack(alignment: .leading, spacing: 8) {
                ForEach(rules, id: \.self) { rule in
                    Label(rule, systemImage: "checkmark.circle.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.textSecondary)
                        .labelStyle(RuleLabelStyle())
                }
            }

            Toggle(isOn: Binding(get: { model.hasTattoos }, set: { model.hasTattoos = $0 })) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("I have tattoos").font(.system(size: 16, weight: .semibold))
                    Text("Adds a 5th photo so we can reproduce them.").font(.system(size: 13)).foregroundStyle(Theme.textMuted)
                }
            }
            .tint(Theme.blue500)
            .card(padding: 14)

            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(model.requiredSlots) { slot in
                    PhotoSlotTile(slot: slot, photo: model.photos[slot]) { image in
                        Task { await model.setPhoto(image, slot: slot) }
                    }
                }
            }

            if let error = model.error { ErrorBanner(message: error) }
        } footer: {
            Button { Task { await model.generatePreviews() } } label: { Text("Generate my free preview") }
                .buttonStyle(PrimaryButtonStyle())
                .disabled(!model.photosComplete)
            if !model.photosComplete {
                Text("\(model.requiredSlots.filter { model.photos[$0] != nil }.count) of \(model.requiredSlots.count) photos added")
                    .font(.system(size: 13)).foregroundStyle(Theme.textMuted)
            }
        }
    }
}

private struct RuleLabelStyle: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 8) {
            configuration.icon.foregroundStyle(Theme.green)
            configuration.title
        }
    }
}

struct PhotoSlotTile: View {
    let slot: PhotoSlot
    let photo: PickedPhoto?
    let onPick: (UIImage) -> Void

    @State private var showSource = false
    @State private var showLibrary = false
    @State private var showCamera = false
    @State private var item: PhotosPickerItem?

    var body: some View {
        Button { showSource = true } label: { tile }
            .buttonStyle(.plain)
            .accessibilityLabel("\(slot.title) photo. \(photo == nil ? "Not added" : "Added"). \(slot.hint)")
            .confirmationDialog(slot.title, isPresented: $showSource, titleVisibility: .visible) {
                if CameraPicker.isAvailable { Button("Take photo") { showCamera = true } }
                Button("Choose from library") { showLibrary = true }
                Button("Cancel", role: .cancel) {}
            }
            .photosPicker(isPresented: $showLibrary, selection: $item, matching: .images)
            .fullScreenCover(isPresented: $showCamera) {
                CameraPicker(onImage: onPick).ignoresSafeArea()
            }
            .onChange(of: item) { _, newItem in
                guard let newItem else { return }
                Task {
                    if let data = try? await newItem.loadTransferable(type: Data.self),
                       let image = ImageProcessing.image(from: data) {
                        onPick(image)
                    }
                    item = nil
                }
            }
    }

    private var tile: some View {
        ZStack(alignment: .bottom) {
            if let photo {
                Image(uiImage: photo.thumbnail).resizable().aspectRatio(contentMode: .fill)
            } else {
                ZStack {
                    RemoteImage(url: Config.exampleImageURL(slot)).opacity(0.28)
                    VStack(spacing: 6) {
                        Image(systemName: "plus.circle.fill").font(.system(size: 28)).foregroundStyle(Theme.blue400)
                        Text("Add").font(.system(size: 13, weight: .semibold))
                    }
                }
            }
            VStack(spacing: 2) {
                Text(slot.title).font(.system(size: 14, weight: .semibold))
                Text(slot.hint).font(.system(size: 11)).foregroundStyle(Color.white.opacity(0.7)).lineLimit(1)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(.black.opacity(0.55))
        }
        .frame(maxWidth: .infinity)
        .aspectRatio(3.0 / 4.0, contentMode: .fit)
        .background(Color.white.opacity(0.04))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(photo == nil ? Theme.border : Theme.green.opacity(0.7), lineWidth: photo == nil ? 1 : 2)
        )
        .overlay(alignment: .topTrailing) {
            if photo != nil {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(Theme.green)
                    .background(Circle().fill(.black))
                    .padding(8)
            }
        }
    }
}
