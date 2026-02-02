import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeftSquare } from "lucide-react";
import Link from "next/link";
import { NewClientForm } from "./new-client-form";

export default function NewClientPage() {
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

            <NewClientForm />
        </div>
    );
}