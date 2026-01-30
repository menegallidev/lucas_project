import { notFound } from "next/navigation";
import { findUserById } from "../actions";
import { EditUserForm } from "./edit-user-form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeftSquare } from "lucide-react";

export default async function EditUserPage({ params }: { params: { id: string } }) {
    const awaitParams = await params;
    const id = Number(awaitParams.id);
    if (!Number.isInteger(id)) notFound();

    const user = await findUserById(id);

    if (!user) notFound();

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant="outline" size="icon" aria-label="Voltar">
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

            <EditUserForm user={user} />
        </div>
    );
}