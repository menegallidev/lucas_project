import { AgendaClient } from "./agenda-client";
import { getAppDateTimeParts } from "@/lib/date-time";
import { listActiveClientsForSelect, listAgendaEventsByMonth } from "@/server/services/agenda.service";

export default async function AgendaPage() {
    const today = getAppDateTimeParts(new Date());
    const year = today.year;
    const month = today.month - 1;
    const [clients, events] = await Promise.all([
        listActiveClientsForSelect(),
        listAgendaEventsByMonth(year, month),
    ]);

    return <AgendaClient initialClients={clients} initialEvents={events} initialYear={year} initialMonth={month} />;
}
