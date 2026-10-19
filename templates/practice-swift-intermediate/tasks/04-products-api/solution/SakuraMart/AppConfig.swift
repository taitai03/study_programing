import Foundation
import SakuraMartKit

/// アプリの設定。どのAPI（モックか本物か）を使うかをここで決める
enum AppConfig {
    /// 商品のAPI。
    /// Xcode の Scheme の環境変数 SAKURA_API_BASE_URL（例: http://localhost:3000）があれば Next.js版のAPIを、なければモックを使う
    static let productAPI: ProductAPI = {
        if let value = ProcessInfo.processInfo.environment["SAKURA_API_BASE_URL"], let url = URL(string: value) {
            return HTTPProductAPI(baseURL: url)
        }
        return MockProductAPI()
    }()
}
