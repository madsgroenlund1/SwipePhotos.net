import SwiftUI

/// Signed out → welcome / free preview. Signed in → the photo library.
struct RootView: View {
    @Environment(AuthSession.self) private var session
    @Environment(AppModel.self) private var app
    @Environment(StoreManager.self) private var store
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        ZStack {
            if session.isSignedIn {
                MainTabView()
                    .transition(.opacity)
            } else {
                WelcomeView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.25), value: session.isSignedIn)
        // The flow is presented from here (not from the welcome screen) so it
        // survives the signed-out → signed-in swap that happens at checkout.
        .fullScreenCover(isPresented: Binding(get: { app.showOnboarding }, set: { app.showOnboarding = $0 })) {
            OnboardingFlow()
        }
        .task {
            await store.loadProducts()
            store.startListening {
                await app.redeemPendingPurchase(store: store, session: session)
                await app.syncPurchases(store: store, session: session)
            }
        }
        .task(id: session.isSignedIn) {
            if session.isSignedIn { await refreshEverything() } else { app.reset() }
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active && session.isSignedIn { Task { await refreshEverything() } }
        }
    }

    private func refreshEverything() async {
        await app.redeemPendingPurchase(store: store, session: session)
        await app.syncPurchases(store: store, session: session)
        await app.refresh(session: session)
    }
}
