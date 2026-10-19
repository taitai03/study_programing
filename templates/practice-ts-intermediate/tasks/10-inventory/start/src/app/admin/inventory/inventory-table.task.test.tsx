// @vitest-environment jsdom
// 課題のテスト（変更しないでください）
import { render, screen, within } from "@testing-library/react";
import { InventoryTable } from "./inventory-table";

vi.mock("./actions", () => ({ receiveStockAction: vi.fn() }));

const items = [
  { id: 5, name: "手延べそうめん 900g", category: "食品", stock: 3, isLow: true },
  { id: 9, name: "だしパック 30袋", category: "食品", stock: 120, isLow: false },
];

describe("InventoryTable", () => {
  it("商品ごとに、商品名・カテゴリ・在庫数を表示する", () => {
    render(<InventoryTable items={items} />);
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("手延べそうめん 900g")).toBeInTheDocument();
    expect(within(rows[0]).getByText("3")).toBeInTheDocument();
    expect(within(rows[1]).getByText("120")).toBeInTheDocument();
  });

  it("在庫不足の商品にだけ「在庫不足」と表示する", () => {
    render(<InventoryTable items={items} />);
    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByText("在庫不足")).toBeInTheDocument();
    expect(within(rows[1]).queryByText("在庫不足")).not.toBeInTheDocument();
  });

  it("商品ごとに、入荷数の入力欄と「入荷する」ボタンがある", () => {
    render(<InventoryTable items={items} />);
    expect(screen.getByLabelText("手延べそうめん 900gの入荷数")).toBeInTheDocument();
    expect(screen.getByLabelText("だしパック 30袋の入荷数")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "入荷する" })).toHaveLength(2);
  });
});
