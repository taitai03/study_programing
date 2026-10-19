// @vitest-environment jsdom
// 課題のテスト（変更しないでください）
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { updateOrderStatus } from "./actions";
import { OrderStatusForm } from "./order-status-form";

vi.mock("./actions", () => ({ updateOrderStatus: vi.fn() }));
const action = vi.mocked(updateOrderStatus);

beforeEach(() => action.mockReset());

describe("OrderStatusForm", () => {
  it("いまのステータスから進めるステータスだけを選択肢にする", () => {
    render(<OrderStatusForm orderId={1} status="paid" />);
    const select = screen.getByLabelText("新しいステータス") as HTMLSelectElement;
    expect([...select.options].map((o) => [o.value, o.text])).toEqual([
      ["shipped", "発送済"],
      ["cancelled", "キャンセル"],
    ]);
  });

  it("進めるステータスがなければ、フォームの代わりにメッセージを表示する", () => {
    render(<OrderStatusForm orderId={1} status="completed" />);
    expect(screen.getByText("これ以上ステータスを変更できません")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "変更する" })).not.toBeInTheDocument();
  });

  it("「変更する」で、注文IDと選んだステータスを Server Action に送る", async () => {
    action.mockResolvedValue({ ok: "ステータスを「キャンセル」に変更しました" });
    const user = userEvent.setup();
    render(<OrderStatusForm orderId={42} status="pending" />);
    await user.selectOptions(screen.getByLabelText("新しいステータス"), "cancelled");
    await user.click(screen.getByRole("button", { name: "変更する" }));

    expect(action).toHaveBeenCalledTimes(1);
    const [orderId, , formData] = action.mock.calls[0];
    expect(orderId).toBe(42);
    expect((formData as FormData).get("status")).toBe("cancelled");
    expect(await screen.findByRole("status")).toHaveTextContent("ステータスを「キャンセル」に変更しました");
  });

  it("送信中はボタンを押せなくし、「変更中…」と表示する", async () => {
    let finish: (state: { ok: string }) => void = () => {};
    action.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const user = userEvent.setup();
    render(<OrderStatusForm orderId={1} status="pending" />);
    await user.click(screen.getByRole("button", { name: "変更する" }));
    const button = await screen.findByRole("button", { name: "変更中…" });
    expect(button).toBeDisabled();

    // 応答が返ったら、もう一度押せるようになる
    finish({ ok: "変更しました" });
    expect(await screen.findByRole("button", { name: "変更する" })).toBeEnabled();
  });

  it("エラーが返ってきたら表示する", async () => {
    action.mockResolvedValue({ error: "「発送済」から「受付」には変更できません" });
    const user = userEvent.setup();
    render(<OrderStatusForm orderId={1} status="pending" />);
    await user.click(screen.getByRole("button", { name: "変更する" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("「発送済」から「受付」には変更できません");
  });
});
