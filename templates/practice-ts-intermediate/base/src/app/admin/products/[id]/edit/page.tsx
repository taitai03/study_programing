import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { parseId } from "@/lib/api";
import { getProduct, listCategories } from "@/lib/products";
import { ProductForm } from "./product-form";

export const metadata: Metadata = { title: "商品の編集" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]/edit">) {
  const id = parseId((await params).id);
  const product = id ? await getProduct(db, id) : undefined;
  if (!product) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <Link href={`/admin/products/${product.id}`} className="text-sm text-muted-foreground hover:underline">
        ← {product.name}
      </Link>
      <h1 className="text-xl font-bold">商品の編集</h1>
      <ProductForm product={product} categories={listCategories(db)} />
    </div>
  );
}
