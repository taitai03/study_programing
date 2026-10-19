// swift-tools-version: 6.0
// さくらマートのロジック（モデル、料金計算、通信、ViewModel）。
// SwiftUI に依存しないので、Linux でもテストできる（GitHub Actions は Linux で swift test を実行する）
import PackageDescription

let package = Package(
    name: "SakuraMartKit",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "SakuraMartKit", targets: ["SakuraMartKit"]),
    ],
    targets: [
        .target(name: "SakuraMartKit"),
        .testTarget(name: "SakuraMartKitTests", dependencies: ["SakuraMartKit"]),
    ],
    // 中級では Swift 5 の言語モードを使う（Swift 6 の厳格な並行性チェックは上級で扱う）
    swiftLanguageModes: [.v5]
)
