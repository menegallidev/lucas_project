import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeftSquare } from "lucide-react";
import Link from "next/link";

export default function NewUser() {
    return (
        <>
            <div className="">
                <div className="flex gap-4 justify-end">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" aria-label="Adicionar usuário">
                                    <Link href="/users">
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
            </div>
        </>
    );
}