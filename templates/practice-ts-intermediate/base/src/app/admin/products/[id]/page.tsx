import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/db";
import { parseId } from "@/lib/api";
import { getProduct } from "@/lib/products";
import { formatDateTime, yen } from "@/lib/utils";

export const metadata: Metadata = { title: "商品の詳細" };

export default async function ProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const id = parseId((await params).id);
  const product = id ? await getProduct(db, id) : undefined;
  if (!product) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/admin/products" className="text-sm text-muted-foreground hover:underline">
        ← 商品一覧
      </Link>
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">{product.name}</h1>
        {product.isPublished ? <Badge variant="success">公開</Badge> : <Badge variant="secondary">非公開</Badge>}
        <Link href={`/admin/products/${product.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm", className: "ml-auto" })}>
          編集
        </Link>
      </div>
      <dl className="grid grid-cols-[8rem_1fr] gap-y-3 text-sm">
        <dt className="text-muted-foreground">ID</dt>
        <dd>{product.id}</dd>
        <dt className="text-muted-foreground">カテゴリ</dt>
        <dd>{product.category.name}</dd>
        <dt className="text-muted-foreground">価格（税抜）</dt>
        <dd>{yen(product.price)}</dd>
        <dt className="text-muted-foreground">説明</dt>
        <dd className="whitespace-pre-wrap">{product.description || "—"}</dd>
        <dt className="text-muted-foreground">更新日時</dt>
        <dd>{formatDateTime(product.updatedAt)}</dd>
      </dl>
    </div>
  );
}
