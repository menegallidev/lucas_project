import { authCookie, verifyAuthToken } from "@/lib/auth";
import { findQuoteForExport } from "@/server/services/quotes.service";
import { cookies } from "next/headers";
import { buildStyledQuotePdf, getBrandingAssets } from "../../_export";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

async function isAuthenticated() {
    const token = (await cookies()).get(authCookie.name)?.value;
    if (!token) return false;

    try {
        await verifyAuthToken(token);
        return true;
    } catch {
        return false;
    }
}

export async function GET(_: Request, context: RouteContext) {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
        return Response.json({ ok: false, message: "Não autorizado." }, { status: 401 });
    }

    const { id } = await context.params;
    const quoteId = Number(id);

    if (!Number.isInteger(quoteId) || quoteId <= 0) {
        return Response.json({ ok: false, message: "Orçamento inválido." }, { status: 400 });
    }

    try {
        const quote = await findQuoteForExport(quoteId);
        if (!quote) {
            return Response.json({ ok: false, message: "Orçamento não encontrado." }, { status: 404 });
        }

        const branding = await getBrandingAssets();
        const pdfBuffer = buildStyledQuotePdf(quote, branding);

        return new Response(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="orcamento-${quote.id}.pdf"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        return Response.json(
            {
                ok: false,
                message: error instanceof Error ? error.message : "Não foi possível gerar o PDF.",
            },
            { status: 500 }
        );
    }
}
