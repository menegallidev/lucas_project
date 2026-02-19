"use client";

import { Button } from "@/components/ui/button";
import { formatInAppTimeZone } from "@/lib/date-time";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

type EventDetailsDialogProps = {
    title: string;
    startAt: string | Date;
    clientName: string | null;
    location: string | null;
    notes: string | null;
};

export function EventDetailsDialog({ title, startAt, clientName, location, notes }: EventDetailsDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button type="button" variant="secondary" size="sm">
                    Ver detalhes
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Detalhes do evento</DialogTitle>
                    <DialogDescription>
                        Informacoes completas do evento selecionado.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] min-w-0 space-y-3 overflow-y-auto pr-1">
                    <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">Titulo</p>
                        <p className="min-w-0 text-sm font-medium break-words [overflow-wrap:anywhere]">{title}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-md border p-3">
                            <p className="text-xs text-muted-foreground">Data e horario</p>
                            <p className="text-sm font-medium">
                                {formatInAppTimeZone(startAt, {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                        </div>
                        <div className="rounded-md border p-3">
                            <p className="text-xs text-muted-foreground">Cliente</p>
                            <p className="min-w-0 text-sm font-medium break-words [overflow-wrap:anywhere]">
                                {clientName ?? "Nao informado"}
                            </p>
                        </div>
                        <div className="rounded-md border p-3 sm:col-span-2">
                            <p className="text-xs text-muted-foreground">Local</p>
                            <p className="min-w-0 text-sm font-medium break-words [overflow-wrap:anywhere]">
                                {location ?? "Nao informado"}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">Observacoes</p>
                        <p className="min-w-0 text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                            {notes ?? "Sem observacoes."}
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Fechar</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
