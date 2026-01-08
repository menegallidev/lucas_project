import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">🚧 Em construção</CardTitle>
          <CardDescription>
            Estamos preparando o sistema de gestão. Em breve teremos novidades por aqui.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-md border p-4 text-sm leading-relaxed">
            <p className="font-medium">O que vem por aí:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Cadastro de clientes e histórico de manutenções</li>
              <li>Agendamentos com calendário</li>
              <li>Controle de estoque e movimentações</li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            Versão inicial do painel em desenvolvimento.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
