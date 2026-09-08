import type {
  Product,
  ProductImage,
  ProductVariant,
  Category,
  SizeGuide,
  Drop,
} from "@prisma/client";

export type ProductWithRelations = Product & {
  images: ProductImage[];
  variants: ProductVariant[];
  category: Category;
  sizeGuide: SizeGuide | null;
};

export type DropSummary = Pick<Drop, "status" | "startsAt" | "endsAt">;

export type ProductCardData = Pick<
  Product,
  "id" | "slug" | "name" | "personalizationEnabled"
> & {
  price: number | null;
  images: Pick<ProductImage, "url" | "alt" | "type">[];
  category: Pick<Category, "name" | "slug">;
  variants: Pick<ProductVariant, "id" | "color" | "size" | "stock">[];
  drop?: DropSummary | null;
};

export type CartLine = {
  variantId: string;
  productSlug: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  personalization: string | null;
  unitPrice: number;
  image: string;
};
