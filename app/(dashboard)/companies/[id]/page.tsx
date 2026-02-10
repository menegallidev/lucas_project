import { notFound } from "next/navigation";
import { findCompanyById } from "../actions";
import { EditCompanyForm } from "./edit-company-form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeftSquare } from "lucide-react";

export default async function EditCompanyPage({ params }: { params: { id: string } }) {
    const awaitParams = await params;
    const id = Number(awaitParams.id);
    if (!Number.isInteger(id)) notFound();

    const company = await findCompanyById(id);

    if (!company) notFound();

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant="outline" size="icon" aria-label="Voltar">
                                <Link href="/companies">
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

            <EditCompanyForm company={company} />
        </div>
    );
}
