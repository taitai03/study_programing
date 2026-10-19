"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { productInputSchema, updateProduct } from "@/lib/products";

export type ProductFormState = { errors?: Record<string, string> } | null;

export async function saveProduct(
  id: number,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  if (!(await auth())) redirect("/login");

  const parsed = productInputSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    price: formData.get("price"),
    categoryId: formData.get("categoryId"),
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { errors };
  }

  updateProduct(db, id, parsed.data);
  revalidatePath("/admin/products");
  redirect(`/admin/products/${id}`);
}
