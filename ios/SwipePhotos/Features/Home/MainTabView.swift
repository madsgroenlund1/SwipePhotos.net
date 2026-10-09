import SwiftUI

struct MainTabView: View {
    @Environment(AppModel.self) private var app

    var body: some View {
        TabView(selection: Binding(get: { app.selectedTab }, set: { app.selectedTab = $0 })) {
            PhotosTab()
                .tabItem { Label("Photos", systemImage: "photo.on.rectangle.angled") }
                .tag(AppTab.photos)
            AccountTab()
                .tabItem { Label("Account", systemImage: "person.crop.circle") }
                .tag(AppTab.account)
        }
        .tint(Theme.blue500)
    }
}
