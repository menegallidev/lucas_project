import { notFound } from "next/navigation";
import { findClientById } from "../actions";
import { listCompaniesForSelect } from "@/server/services/companies.service";
import { EditClientForm } from "./edit-client-form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeftSquare } from "lucide-react";

export default async function EditClientPage({ params }: { params: { id: string } }) {
    const awaitParams = await params;
    const id = Number(awaitParams.id);
    if (!Number.isInteger(id)) notFound();

    const client = await findClientById(id);
    const companies = await listCompaniesForSelect();

    if (!client) notFound();

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant="outline" size="icon" aria-label="Voltar">
                                <Link href="/clients">
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

            <EditClientForm client={client} companies={companies} />
        </div>
    );
}
