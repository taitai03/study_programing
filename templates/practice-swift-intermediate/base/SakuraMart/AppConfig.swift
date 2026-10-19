import SakuraMartKit

/// アプリの設定。どのAPI（モックか本物か）を使うかをここで決める
enum AppConfig {
    /// 商品のAPI。いまはアプリの中のモックを使う
    static let productAPI: ProductAPI = MockProductAPI()
}
