import { notFound } from "next/navigation";
import { findProductById } from "../actions";
import { EditProductForm } from "./edit-product-form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeftSquare } from "lucide-react";

export default async function EditProductPage({ params }: { params: { id: string } }) {
    const awaitParams = await params;
    const id = Number(awaitParams.id);
    if (!Number.isInteger(id)) notFound();

    const product = await findProductById(id);

    if (!product) notFound();

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant="outline" size="icon" aria-label="Voltar">
                                <Link href="/products">
                                    <ArrowLeftSquare />
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Voltar</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <EditProductForm product={product} />
        </div>
    );
}
