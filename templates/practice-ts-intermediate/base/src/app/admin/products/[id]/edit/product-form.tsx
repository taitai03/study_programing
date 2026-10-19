"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { Product } from "@/db/schema";
import { saveProduct } from "./actions";

type Props = {
  product: Product;
  categories: { id: number; name: string }[];
};

export function ProductForm({ product, categories }: Props) {
  const [state, action, pending] = useActionState(saveProduct.bind(null, product.id), null);
  const errors = state?.errors ?? {};

  return (
    <form action={action} className="space-y-5">
      <Field label="商品名" name="name" error={errors.name}>
        <Input id="name" name="name" defaultValue={product.name} aria-invalid={Boolean(errors.name)} />
      </Field>
      <Field label="説明" name="description" error={errors.description}>
        <Textarea id="description" name="description" defaultValue={product.description} />
      </Field>
      <Field label="価格（税抜・円）" name="price" error={errors.price}>
        <Input id="price" name="price" inputMode="numeric" defaultValue={product.price} aria-invalid={Boolean(errors.price)} />
      </Field>
      <Field label="カテゴリ" name="categoryId" error={errors.categoryId}>
        <Select id="categoryId" name="categoryId" defaultValue={product.categoryId}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isPublished" defaultChecked={product.isPublished} />
        公開する
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "保存中…" : "保存する"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
