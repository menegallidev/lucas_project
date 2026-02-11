import { listInventoryMovements, listInventoryProductsForSelect } from "@/server/services/inventory.service";
import InventoryClient from "./inventory-client";

export default async function InventoryPage() {
    const [products, movements] = await Promise.all([
        listInventoryProductsForSelect(),
        listInventoryMovements(),
    ]);

    return <InventoryClient products={products} initialMovements={movements} />;
}
