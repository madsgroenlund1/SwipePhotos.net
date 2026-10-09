import SwiftUI

@main
struct SwipePhotosApp: App {
    @State private var session = AuthSession()
    @State private var app = AppModel()
    @State private var store = StoreManager()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(session)
                .environment(app)
                .environment(store)
                .preferredColorScheme(.dark)
                .tint(Theme.blue500)
        }
    }
}
