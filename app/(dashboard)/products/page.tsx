import { listProductsBySearch } from "@/server/services/products.service";
import { ProductSearchType } from "@/types/products/search";
import ProductsClient from "./products-client";

export default async function ProductsPage({ searchParams }: { searchParams: ProductSearchType }) {
    const awaitSearchParams = (await searchParams) ?? {};
    const search = awaitSearchParams?.search ?? "";
    const products = await listProductsBySearch(search);

    return <ProductsClient initialProducts={products} searchParams={search} />;
}
