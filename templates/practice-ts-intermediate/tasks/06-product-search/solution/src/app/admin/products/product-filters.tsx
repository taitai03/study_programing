"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

type Props = {
  categories: { id: number; name: string }[];
  q?: string;
  categoryId?: number;
};

/** 商品一覧の検索条件（キーワードとカテゴリ）。検索すると、条件をURLのクエリにして移動する */
export function ProductFilters({ categories, q = "", categoryId }: Props) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(q);
  const [category, setCategory] = useState(categoryId ? String(categoryId) : "");

  function search(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    if (category) params.set("category", category);
    const query = params.toString();
    router.push(query ? `/admin/products?${query}` : "/admin/products");
  }

  function clear() {
    setKeyword("");
    setCategory("");
    router.push("/admin/products");
  }

  return (
    <form onSubmit={search} className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
      <div className="min-w-64 flex-1 space-y-1">
        <Label htmlFor="q">キーワード</Label>
        <Input
          id="q"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="商品名・説明（空白で区切って複数指定）"
        />
      </div>
      <div className="w-48 space-y-1">
        <Label htmlFor="category">カテゴリ</Label>
        <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">すべて</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit">検索</Button>
      <Button type="button" variant="outline" onClick={clear}>
        クリア
      </Button>
    </form>
  );
}
