import { AgendaClient } from "./agenda-client";
import { listActiveClientsForSelect, listAgendaEventsByMonth } from "@/server/services/agenda.service";

export default async function AgendaPage() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const [clients, events] = await Promise.all([
        listActiveClientsForSelect(),
        listAgendaEventsByMonth(year, month),
    ]);

    return <AgendaClient initialClients={clients} initialEvents={events} initialYear={year} initialMonth={month} />;
}
