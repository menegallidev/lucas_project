/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    dateFromAppParts,
    formatInAppTimeZone,
    getAppDateTimeParts,
    parseDateKeyInAppTimeZone,
    toDateKeyInAppTimeZone,
} from "@/lib/date-time";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/app/inputs/date-picker";
import { createAgendaEventAction, deleteAgendaEventAction, listEventsByMonthAction, updateAgendaEventAction } from "./actions";
import type { AgendaEventRow, CreateAgendaEventState, DeleteAgendaEventState, UpdateAgendaEventState } from "@/types/agenda/event";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/app/confirm-dialog";

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function toDateKey(date: Date) {
    return toDateKeyInAppTimeZone(date);
}

function toDateKeyParts(year: number, month: number, day: number) {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
}

function toInputDate(value?: Date) {
    if (!value) return "";
    const { year, month, day } = getAppDateTimeParts(value);
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toInputTime(value?: Date) {
    if (!value) return "";
    const { hour, minute } = getAppDateTimeParts(value);
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function fromDateKey(dateKey: string) {
    return parseDateKeyInAppTimeZone(dateKey);
}

const initialCreateState: CreateAgendaEventState = { ok: true, attempt: 0 };
const initialUpdateState: UpdateAgendaEventState = { ok: true, attempt: 0 };
const initialDeleteState: DeleteAgendaEventState = { ok: true, attempt: 0 };

export function AgendaClient({
    initialClients,
    initialEvents,
    initialYear,
    initialMonth,
}: {
    initialClients: Array<{ id: number; name: string }>;
    initialEvents: AgendaEventRow[];
    initialYear: number;
    initialMonth: number;
}) {
    const today = new Date();
    const todayYear = getAppDateTimeParts(today).year;
    const [selectedDate, setSelectedDate] = useState<string>(toDateKey(today));
    const [open, setOpen] = useState(false);
    const [events, setEvents] = useState<AgendaEventRow[]>(initialEvents);
    const [, startTransition] = useTransition();

    const [eventTitle, setEventTitle] = useState("");
    const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
    const [eventTime, setEventTime] = useState("");
    const [eventClientId, setEventClientId] = useState("");
    const [eventLocation, setEventLocation] = useState("");
    const [eventNotes, setEventNotes] = useState("");
    const [editingEventId, setEditingEventId] = useState<number | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [createState, createFormAction, creating] = useActionState(createAgendaEventAction, initialCreateState);
    const [updateState, updateFormAction, updating] = useActionState(updateAgendaEventAction, initialUpdateState);
    const [deleteState, deleteFormAction, deleting] = useActionState(deleteAgendaEventAction, initialDeleteState);

    const [currentYear, setCurrentYear] = useState(() => initialYear);
    const [currentMonth, setCurrentMonth] = useState(() => initialMonth);

    const { year, month, days, leading } = useMemo(() => {
        const y = currentYear;
        const m = currentMonth;
        const firstDay = new Date(y, m, 1);
        const jsDay = firstDay.getDay(); // 0=Dom
        const leadingDays = (jsDay + 6) % 7; // Seg = 0
        const daysInMonth = new Date(y, m + 1, 0).getDate();

        return {
            year: y,
            month: m,
            days: daysInMonth,
            leading: leadingDays,
        };
    }, [currentMonth, currentYear]);

    const eventsByDate = useMemo(() => {
        return events.reduce<Record<string, AgendaEventRow[]>>((acc, ev) => {
            const key = toDateKey(new Date(ev.startAt));
            acc[key] = acc[key] ? [...acc[key], ev] : [ev];
            return acc;
        }, {});
    }, [events]);

    const selectedEvents = eventsByDate[selectedDate] ?? [];
    const selectedDateValue = fromDateKey(selectedDate);

    const resetEventForm = () => {
        setEditingEventId(null);
        setEventTitle("");
        setEventDate(undefined);
        setEventTime("");
        setEventClientId("");
        setEventLocation("");
        setEventNotes("");
    };

    const refreshEvents = () => {
        startTransition(() => {
            void listEventsByMonthAction(currentYear, currentMonth).then((items) => {
                setEvents(items);
            });
        });
    };

    useEffect(() => {
        refreshEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentMonth, currentYear]);

    useEffect(() => {
        if (!createState.attempt) return;
        if (createState.ok) {
            if (createState.message) toast.success(createState.message);
            setOpen(false);
            resetEventForm();
            refreshEvents();
            return;
        }
        if (createState.message) toast.error(createState.message);
    }, [createState.attempt, createState.ok, createState.message]);

    useEffect(() => {
        if (!updateState.attempt) return;
        if (updateState.ok) {
            if (updateState.message) toast.success(updateState.message);
            setOpen(false);
            resetEventForm();
            refreshEvents();
            return;
        }
        if (updateState.message) toast.error(updateState.message);
    }, [updateState.attempt, updateState.ok, updateState.message]);

    useEffect(() => {
        if (!deleteState.attempt) return;
        if (deleteState.ok) {
            toast.success(deleteState.message ?? "Evento excluído com sucesso!");
            refreshEvents();
        }
        else toast.error(deleteState.message ?? "Não foi possível excluir.");
    }, [deleteState.attempt, deleteState.ok, deleteState.message]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold">Agenda</h1>
                    <p className="text-sm text-muted-foreground">
                        Visualize e marque eventos do mês
                    </p>
                </div>
                <Dialog open={open} onOpenChange={(next) => {
                    setOpen(next);
                    if (!next) resetEventForm();
                }}>
                    <DialogTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                if (!open) resetEventForm();
                            }}
                        >
                            Novo evento
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingEventId ? "Editar evento" : "Novo evento"}</DialogTitle>
                            <DialogDescription>
                                Preencha as informações do evento. Título e data são obrigatórios.
                            </DialogDescription>
                        </DialogHeader>

                        <form action={editingEventId ? updateFormAction : createFormAction}>
                            {editingEventId ? <input type="hidden" name="id" value={editingEventId} /> : null}
                            <input type="hidden" name="date" value={toInputDate(eventDate)} />
                            <input type="hidden" name="clientId" value={eventClientId} />
                            <FieldGroup className="grid gap-4 grid-cols-4">
                                <Field className="col-span-4">
                                    <FieldLabel htmlFor="eventTitle">Título</FieldLabel>
                                    <Input
                                        id="eventTitle"
                                        name="title"
                                        placeholder="Ex.: Reunião com cliente"
                                        required
                                        value={eventTitle}
                                        onChange={(e) => setEventTitle(e.target.value)}
                                    />
                                </Field>

                                <Field className="col-span-2">
                                    <FieldLabel htmlFor="eventDate">Data</FieldLabel>
                                    <DatePicker
                                        value={eventDate}
                                        onChange={setEventDate}
                                        placeholder="Selecione a data"
                                    />
                                </Field>

                                <Field className="col-span-2">
                                    <FieldLabel htmlFor="eventTime">Horário</FieldLabel>
                                    <Input
                                        id="eventTime"
                                        name="time"
                                        type="time"
                                        value={eventTime}
                                        onChange={(e) => setEventTime(e.target.value)}
                                    />
                                </Field>

                                <Field className="col-span-4">
                                    <FieldLabel htmlFor="eventClientId">Cliente</FieldLabel>
                                    <Select value={eventClientId} onValueChange={setEventClientId}>
                                        <SelectTrigger id="eventClientId">
                                            <SelectValue placeholder="Selecione um cliente" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {initialClients.map((client) => (
                                                <SelectItem key={client.id} value={String(client.id)}>
                                                    {client.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Field className="col-span-4">
                                    <FieldLabel htmlFor="eventLocation">Localização</FieldLabel>
                                    <Input
                                        id="eventLocation"
                                        name="location"
                                        placeholder="Endereço ou ponto de encontro"
                                        value={eventLocation}
                                        onChange={(e) => setEventLocation(e.target.value)}
                                    />
                                </Field>

                                <Field className="col-span-4">
                                    <FieldLabel htmlFor="eventNotes">Observações</FieldLabel>
                                    <Textarea
                                        id="eventNotes"
                                        name="notes"
                                        placeholder="Observações adicionais"
                                        rows={4}
                                        value={eventNotes}
                                        onChange={(e) => setEventNotes(e.target.value)}
                                    />
                                </Field>
                            </FieldGroup>

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={!eventTitle || !eventDate || creating || updating}>
                                    {editingEventId ? "Salvar alterações" : "Salvar evento"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-base">
                            {formatInAppTimeZone(dateFromAppParts({ year, month: month + 1, day: 1 }), {
                                month: "long",
                                year: "numeric",
                            })}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={String(currentMonth)} onValueChange={(v) => setCurrentMonth(Number(v))}>
                                <SelectTrigger className="w-[170px]">
                                    <SelectValue placeholder="Mês" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <SelectItem key={i} value={String(i)}>
                                            {formatInAppTimeZone(dateFromAppParts({ year: currentYear, month: i + 1, day: 1 }), {
                                                month: "long",
                                            })}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={String(currentYear)} onValueChange={(v) => setCurrentYear(Number(v))}>
                                <SelectTrigger className="w-[110px]">
                                    <SelectValue placeholder="Ano" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 5 }).map((_, i) => {
                                        const y = todayYear - 2 + i;
                                        return (
                                            <SelectItem key={y} value={String(y)}>
                                                {y}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            <div className="text-xs text-muted-foreground">
                                Selecione um dia para ver detalhes
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 text-xs text-muted-foreground mb-2">
                            {weekDays.map((d) => (
                                <div key={d} className="px-2 py-1">
                                    {d}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {Array.from({ length: leading }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}
                            {Array.from({ length: days }).map((_, i) => {
                                const day = i + 1;
                                const key = toDateKeyParts(year, month, day);
                                const isToday = key === toDateKey(today);
                                const isSelected = key === selectedDate;
                                const hasEvents = Boolean(eventsByDate[key]?.length);

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setSelectedDate(key)}
                                        className={cn(
                                            "rounded-md border px-2 py-2 text-left text-sm transition-colors",
                                            "hover:bg-accent hover:text-accent-foreground",
                                            isSelected && "bg-accent text-accent-foreground",
                                            !isSelected && "bg-background",
                                            isToday && "border-primary"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={cn("font-medium", isSelected ? "" : "text-foreground")}>
                                                {day}
                                            </span>
                                            {hasEvents && (
                                                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                            )}
                                        </div>
                                        {hasEvents && (
                                            <div className="mt-2 space-y-1">
                                                {eventsByDate[key].slice(0, 2).map((ev: any) => (
                                                    <div
                                                        key={ev.id}
                                                        className="truncate text-[11px] text-muted-foreground"
                                                    >
                                                        {ev.time ? `${ev.time} • ` : ""}{ev.title}
                                                    </div>
                                                ))}
                                                {eventsByDate[key].length > 2 && (
                                                    <div className="text-[10px] text-muted-foreground">
                                                        +{eventsByDate[key].length - 2} eventos
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Eventos do dia</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground mb-4">
                            {selectedDateValue
                                ? formatInAppTimeZone(selectedDateValue, {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                })
                                : selectedDate}
                        </div>

                        {selectedEvents.length === 0 && (
                            <div className="text-sm text-muted-foreground">
                                Nenhum evento para este dia.
                            </div>
                        )}

                        <div className="space-y-3">
                            {selectedEvents.map((ev) => (
                                <div
                                    key={ev.id}
                                    className="rounded-md border p-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium">{ev.title}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {formatInAppTimeZone(ev.startAt, {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {ev.location ?? "Sem localização"}
                                    </div>
                                    {ev.clientName && (
                                        <div className="text-xs text-muted-foreground">
                                            Cliente: {ev.clientName}
                                        </div>
                                    )}
                                    <div className="mt-2 flex gap-2">
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
                                                        <p className="min-w-0 text-sm font-medium break-words [overflow-wrap:anywhere]">{ev.title}</p>
                                                    </div>
                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                        <div className="rounded-md border p-3">
                                                            <p className="text-xs text-muted-foreground">Data e horario</p>
                                                            <p className="text-sm font-medium">
                                                                {formatInAppTimeZone(ev.startAt, {
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
                                                            <p className="min-w-0 text-sm font-medium break-words [overflow-wrap:anywhere]">{ev.clientName ?? "Nao informado"}</p>
                                                        </div>
                                                        <div className="rounded-md border p-3 sm:col-span-2">
                                                            <p className="text-xs text-muted-foreground">Local</p>
                                                            <p className="min-w-0 text-sm font-medium break-words [overflow-wrap:anywhere]">{ev.location ?? "Nao informado"}</p>
                                                        </div>
                                                    </div>
                                                    <div className="rounded-md border p-3">
                                                        <p className="text-xs text-muted-foreground">Observacoes</p>
                                                        <p className="min-w-0 text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{ev.notes ?? "Sem observacoes."}</p>
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button type="button" variant="outline">Fechar</Button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setEditingEventId(ev.id);
                                                setEventTitle(ev.title);
                                                const dt = new Date(ev.startAt);
                                                setEventDate(parseDateKeyInAppTimeZone(toDateKeyInAppTimeZone(dt)) ?? dt);
                                                setEventTime(toInputTime(dt));
                                                setEventClientId(ev.clientId ? String(ev.clientId) : "");
                                                setEventLocation(ev.location ?? "");
                                                setEventNotes(ev.notes ?? "");
                                                setOpen(true);
                                            }}
                                        >
                                            Editar
                                        </Button>
                                        <ConfirmDialog
                                            title="Excluir evento"
                                            description={(
                                                <>
                                                    Tem certeza que deseja excluir este evento? <br />
                                                    Essa ação não pode ser desfeita.
                                                </>
                                            )}
                                            confirmText={deleting ? "Excluindo..." : "Excluir"}
                                            cancelText="Cancelar"
                                            confirmVariantClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            trigger={
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => setSelectedEventId(ev.id)}
                                                >
                                                    Excluir
                                                </Button>
                                            }
                                            onConfirm={() => {
                                                if (!selectedEventId) return;
                                                const fd = new FormData();
                                                fd.set("id", String(selectedEventId));
                                                startTransition(() => {
                                                    void deleteFormAction(fd);
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
