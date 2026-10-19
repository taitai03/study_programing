// @vitest-environment jsdom
// 課題のテスト（変更しないでください）
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductFilters } from "./product-filters";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
}));

const categories = [
  { id: 1, name: "食品" },
  { id: 2, name: "飲料" },
];

beforeEach(() => push.mockClear());

describe("ProductFilters", () => {
  it("キーワードの入力欄と、「すべて」から始まるカテゴリの選択肢を表示する", () => {
    render(<ProductFilters categories={categories} />);
    expect(screen.getByLabelText("キーワード")).toHaveValue("");
    const select = screen.getByLabelText("カテゴリ");
    expect(select).toHaveValue("");
    expect([...(select as HTMLSelectElement).options].map((o) => o.text)).toEqual(["すべて", "食品", "飲料"]);
  });

  it("いまの検索条件を初期値として表示する", () => {
    render(<ProductFilters categories={categories} q="お茶" categoryId={2} />);
    expect(screen.getByLabelText("キーワード")).toHaveValue("お茶");
    expect(screen.getByLabelText("カテゴリ")).toHaveValue("2");
  });

  it("「検索」で、条件をURLのクエリにして移動する", async () => {
    const user = userEvent.setup();
    render(<ProductFilters categories={categories} />);
    await user.type(screen.getByLabelText("キーワード"), " お茶 ");
    await user.selectOptions(screen.getByLabelText("カテゴリ"), "2");
    await user.click(screen.getByRole("button", { name: "検索" }));
    expect(push).toHaveBeenCalledWith(`/admin/products?q=${encodeURIComponent("お茶")}&category=2`);
  });

  it("入力欄で Enter を押しても検索する。空の条件はクエリに含めない", async () => {
    const user = userEvent.setup();
    render(<ProductFilters categories={categories} />);
    await user.type(screen.getByLabelText("キーワード"), "米{Enter}");
    expect(push).toHaveBeenCalledWith(`/admin/products?q=${encodeURIComponent("米")}`);
  });

  it("「クリア」で入力を空にして、条件なしの一覧に戻る", async () => {
    const user = userEvent.setup();
    render(<ProductFilters categories={categories} q="お茶" categoryId={2} />);
    await user.click(screen.getByRole("button", { name: "クリア" }));
    expect(screen.getByLabelText("キーワード")).toHaveValue("");
    expect(screen.getByLabelText("カテゴリ")).toHaveValue("");
    expect(push).toHaveBeenCalledWith("/admin/products");
  });
});
