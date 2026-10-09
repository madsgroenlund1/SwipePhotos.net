// Used ONLY by tools/typecheck.sh (compile-checking without Xcode installed).
// The macOS 27 SDK declares @State as a macro whose plugin ships with Xcode;
// typecheck.sh compiles a temp copy of the sources with `@State` rewritten to
// `@StateShim`, defined here. It is NOT part of the Xcode project.
import SwiftUI

@propertyWrapper
struct StateShim<Value>: DynamicProperty {
    private final class Box {
        var value: Value
        init(_ value: Value) { self.value = value }
    }
    private let box: Box
    init(wrappedValue: Value) { box = Box(wrappedValue) }
    init(initialValue: Value) { box = Box(initialValue) }
    var wrappedValue: Value {
        get { box.value }
        nonmutating set { box.value = newValue }
    }
    var projectedValue: Binding<Value> {
        let box = self.box
        return Binding(get: { box.value }, set: { box.value = $0 })
    }
}
