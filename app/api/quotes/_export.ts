import { formatInAppTimeZone } from "@/lib/date-time";
import type { QuoteForExport } from "@/server/services/quotes.service";
import { readFile } from "node:fs/promises";
import path from "node:path";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const qtyFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const COMPANY_NAME = "Inova Grelhas Lineares";

type JpegMeta = {
    width: number;
    height: number;
    components: number;
};

type BrandingAssets = {
    companyName: string;
    logoBytes: Buffer | null;
    logoBase64: string | null;
    logoMeta: JpegMeta | null;
};

type QuoteRow = {
    description: string;
    qty: string;
    unit: string;
    discount: string;
    total: string;
};

let brandingAssetsPromise: Promise<BrandingAssets> | null = null;

function truncateText(value: string, maxLength: number) {
    if (value.length <= maxLength) return value;
    if (maxLength <= 1) return value.slice(0, maxLength);
    return `${value.slice(0, maxLength - 1)}...`;
}

function compactSpaces(value: string) {
    return value.replace(/\s+/g, " ").trim();
}

function safeLine(value: string, maxLineLength: number) {
    return truncateText(compactSpaces(value), maxLineLength);
}

function toPdfSafeText(value: string) {
    const asciiText = value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\x20-\x7E]/g, "?");

    return asciiText.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function formatDiscountLabel(discountType: QuoteForExport["items"][number]["discountType"], discountValue: number) {
    if (discountType === "PERCENT") return `${qtyFormatter.format(discountValue)}%`;
    return brl.format(discountValue);
}

function mapRows(quote: QuoteForExport, maxRows: number): QuoteRow[] {
    const visibleItems = quote.items.slice(0, maxRows);
    return visibleItems.map((item) => ({
        description: safeLine(`${item.productName} (${item.productModel})`, 46),
        qty: qtyFormatter.format(item.quantity),
        unit: brl.format(item.saleUnitPrice),
        discount: formatDiscountLabel(item.discountType, item.discountValue),
        total: brl.format(item.totalSaleNet),
    }));
}

function formatMeta(quote: QuoteForExport) {
    const createdAt = formatInAppTimeZone(quote.createdAt, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
    const soldAt = quote.soldAt
        ? formatInAppTimeZone(quote.soldAt, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "-";

    return { createdAt, soldAt };
}

function parseJpegMeta(bytes: Buffer): JpegMeta | null {
    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

    let offset = 2;
    while (offset + 9 < bytes.length) {
        while (offset < bytes.length && bytes[offset] !== 0xff) offset += 1;
        while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
        if (offset >= bytes.length) break;

        const marker = bytes[offset];
        offset += 1;

        if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
            continue;
        }

        if (offset + 1 >= bytes.length) break;
        const segmentLength = (bytes[offset] << 8) + bytes[offset + 1];
        if (segmentLength < 2 || offset + segmentLength > bytes.length) break;

        const isSofMarker =
            (marker >= 0xc0 && marker <= 0xc3) ||
            (marker >= 0xc5 && marker <= 0xc7) ||
            (marker >= 0xc9 && marker <= 0xcb) ||
            (marker >= 0xcd && marker <= 0xcf);

        if (isSofMarker && segmentLength >= 8) {
            const height = (bytes[offset + 3] << 8) + bytes[offset + 4];
            const width = (bytes[offset + 5] << 8) + bytes[offset + 6];
            const components = bytes[offset + 7];

            if (width > 0 && height > 0 && components > 0) {
                return { width, height, components };
            }
        }

        offset += segmentLength;
    }

    return null;
}

async function loadBrandingAssets(): Promise<BrandingAssets> {
    try {
        const logoPath = path.join(process.cwd(), "public", "logo.jpeg");
        const logoBytes = await readFile(logoPath);
        const logoMeta = parseJpegMeta(logoBytes);

        return {
            companyName: COMPANY_NAME,
            logoBytes,
            logoBase64: logoBytes.toString("base64"),
            logoMeta,
        };
    } catch {
        return {
            companyName: COMPANY_NAME,
            logoBytes: null,
            logoBase64: null,
            logoMeta: null,
        };
    }
}

export function getBrandingAssets() {
    if (!brandingAssetsPromise) {
        brandingAssetsPromise = loadBrandingAssets();
    }
    return brandingAssetsPromise;
}

export function escapeXml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function drawText(font: "F1" | "F2", size: number, x: number, y: number, text: string) {
    return `BT /${font} ${size} Tf ${x} ${y} Td (${toPdfSafeText(text)}) Tj ET`;
}

function logoColorSpace(meta: JpegMeta | null) {
    if (!meta) return "/DeviceRGB";
    if (meta.components === 1) return "/DeviceGray";
    if (meta.components === 4) return "/DeviceCMYK";
    return "/DeviceRGB";
}

function logoDecode(meta: JpegMeta | null) {
    if (!meta) return "";
    if (meta.components === 4) return " /Decode [1 0 1 0 1 0 1 0]";
    return "";
}

function encodeAscii85(data: Buffer) {
    let output = "";
    let index = 0;

    while (index < data.length) {
        const remaining = data.length - index;
        const chunkLength = Math.min(4, remaining);
        const b0 = data[index] ?? 0;
        const b1 = data[index + 1] ?? 0;
        const b2 = data[index + 2] ?? 0;
        const b3 = data[index + 3] ?? 0;
        index += chunkLength;

        const value = ((b0 * 256 + b1) * 256 + b2) * 256 + b3;

        if (chunkLength === 4 && value === 0) {
            output += "z";
            continue;
        }

        const chars = new Array(5).fill(0);
        let current = value;
        for (let i = 4; i >= 0; i -= 1) {
            chars[i] = (current % 85) + 33;
            current = Math.floor(current / 85);
        }

        const usefulChars = chunkLength < 4 ? chunkLength + 1 : 5;
        output += String.fromCharCode(...chars.slice(0, usefulChars));
    }

    output += "~>";
    return output;
}

export function buildStyledQuotePdf(quote: QuoteForExport, branding: BrandingAssets) {
    const rows = mapRows(quote, 16);
    const meta = formatMeta(quote);

    const hasLogo = Boolean(branding.logoBytes);
    const logoMeta = branding.logoMeta ?? {
        width: 280,
        height: 120,
        components: 3,
    };
    const logoRatio = logoMeta ? logoMeta.width / logoMeta.height : 2.2;
    const logoDrawHeight = 44;
    const logoDrawWidth = Math.max(90, Math.min(170, logoDrawHeight * logoRatio));
    const companyX = hasLogo ? 46 + logoDrawWidth + 16 : 46;

    const commands: string[] = [];
    commands.push("q 0.97 0.98 0.99 rg 40 748 515 62 re f Q");
    commands.push("q 0.84 0.87 0.92 RG 0.8 w 40 748 515 62 re S Q");

    if (hasLogo) {
        commands.push(`q ${logoDrawWidth} ${logoDrawHeight} 0 0 46 758 cm /Im1 Do Q`);
    }

    commands.push(drawText("F2", 16, companyX, 790, branding.companyName));
    commands.push(drawText("F1", 10, companyX, 774, "Orçamento comercial"));
    commands.push(drawText("F2", 14, 450, 790, `#${quote.id}`));
    commands.push(drawText("F1", 9, 450, 774, `Status: ${quote.status}`));

    commands.push(drawText("F1", 10, 46, 728, `Cliente: ${safeLine(quote.clientName, 78)}`));
    commands.push(drawText("F1", 10, 46, 712, `Título: ${safeLine(quote.title || "-", 92)}`));
    commands.push(drawText("F1", 9, 46, 696, `Criado: ${meta.createdAt} | Vendido: ${meta.soldAt}`));

    commands.push("q 0.92 0.94 0.97 rg 40 664 515 20 re f Q");
    commands.push(drawText("F2", 9, 46, 669, "Produto"));
    commands.push(drawText("F2", 9, 305, 669, "Qtd"));
    commands.push(drawText("F2", 9, 346, 669, "Unitário"));
    commands.push(drawText("F2", 9, 430, 669, "Desc."));
    commands.push(drawText("F2", 9, 505, 669, "Total"));

    let y = 646;
    for (let i = 0; i < rows.length; i += 1) {
        if (i % 2 === 0) {
            commands.push(`q 0.985 0.99 1 rg 40 ${y - 4} 515 18 re f Q`);
        }

        const row = rows[i];
        commands.push(drawText("F1", 8.8, 46, y, row.description));
        commands.push(drawText("F1", 8.8, 305, y, row.qty));
        commands.push(drawText("F1", 8.8, 346, y, row.unit));
        commands.push(drawText("F1", 8.8, 430, y, row.discount));
        commands.push(drawText("F1", 8.8, 505, y, row.total));
        y -= 19;
    }

    if (quote.items.length > rows.length) {
        commands.push(drawText("F1", 8.8, 46, y - 2, `+ ${quote.items.length - rows.length} item(ns) não exibidos`));
    }

    commands.push("q 0.975 0.98 0.99 rg 40 118 334 112 re f Q");
    commands.push("q 0.88 0.91 0.95 RG 0.8 w 40 118 334 112 re S Q");
    commands.push(drawText("F2", 10, 48, 213, "Observações"));
    commands.push(drawText("F1", 9, 48, 195, safeLine(quote.notes || "-", 82)));

    commands.push("q 0.95 0.97 1 rg 388 118 167 162 re f Q");
    commands.push("q 0.86 0.90 0.96 RG 0.8 w 388 118 167 162 re S Q");
    commands.push(drawText("F2", 10, 396, 263, "Resumo"));
    commands.push(drawText("F1", 9, 396, 244, `Total compra: ${brl.format(quote.purchaseTotal)}`));
    commands.push(drawText("F1", 9, 396, 228, `Total bruto: ${brl.format(quote.saleGrossTotal)}`));
    commands.push(drawText("F1", 9, 396, 212, `Desc. itens: ${brl.format(quote.itemDiscountTotal)}`));
    commands.push(drawText("F1", 9, 396, 196, `Desc. geral: ${brl.format(quote.generalDiscountAmount)}`));
    commands.push(drawText("F2", 10, 396, 176, `Total líquido: ${brl.format(quote.saleNetTotal)}`));

    commands.push("q 0.92 0.94 0.97 rg 40 86 515 20 re f Q");
    commands.push(drawText("F1", 8.5, 46, 91, `${branding.companyName} | Documento gerado automaticamente`));

    const contentStream = commands.join("\n");
    const contentLength = Buffer.byteLength(contentStream, "latin1");

    const imageObjId = hasLogo ? 6 : null;
    const contentObjId = hasLogo ? 7 : 6;
    const resources = hasLogo
        ? `<< /Font << /F1 4 0 R /F2 5 0 R >> /XObject << /Im1 ${imageObjId} 0 R >> >>`
        : "<< /Font << /F1 4 0 R /F2 5 0 R >> >>";

    const objects: string[] = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources ${resources} /Contents ${contentObjId} 0 R >>`,
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    ];

    if (hasLogo && branding.logoBytes) {
        const logoAscii85 = encodeAscii85(branding.logoBytes);
        const cs = logoColorSpace(logoMeta);
        const decode = logoDecode(logoMeta);
        const logoLength = Buffer.byteLength(logoAscii85, "latin1");

        objects.push(
            `<< /Type /XObject /Subtype /Image /Width ${logoMeta.width} /Height ${logoMeta.height} /ColorSpace ${cs}${decode} /BitsPerComponent 8 /Filter [/ASCII85Decode /DCTDecode] /Length ${logoLength} >>\nstream\n${logoAscii85}\nendstream`
        );
    }

    objects.push(`<< /Length ${contentLength} >>\nstream\n${contentStream}\nendstream`);

    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [0];

    for (let i = 0; i < objects.length; i += 1) {
        offsets.push(Buffer.byteLength(pdf, "latin1"));
        pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
    }

    const xrefOffset = Buffer.byteLength(pdf, "latin1");
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";

    for (let i = 1; i <= objects.length; i += 1) {
        pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(pdf, "latin1");
}

export function buildStyledQuoteSvg(quote: QuoteForExport, branding: BrandingAssets) {
    const rows = mapRows(quote, 20);
    const meta = formatMeta(quote);

    const headerHeight = 156;
    const tableStartY = 248;
    const rowHeight = 34;
    const tableHeight = 48 + rows.length * rowHeight;
    const infoY = tableStartY + tableHeight + 26;
    const footerY = infoY + 152;
    const height = Math.max(920, footerY + 80);

    const logoRatio = branding.logoMeta ? branding.logoMeta.width / branding.logoMeta.height : 2.2;
    const logoHeight = 84;
    const logoWidth = Math.max(120, Math.min(220, logoHeight * logoRatio));
    const hasLogo = Boolean(branding.logoBase64);

    const rowMarkup = rows
        .map((row, index) => {
            const y = tableStartY + 76 + index * rowHeight;
            const rowBg = index % 2 === 0 ? "#f8fafc" : "#ffffff";
            return `
  <rect x="44" y="${y - 22}" width="1312" height="${rowHeight}" fill="${rowBg}" />
  <text x="56" y="${y}" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#0f172a">${escapeXml(row.description)}</text>
  <text x="850" y="${y}" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#0f172a">${escapeXml(row.qty)}</text>
  <text x="936" y="${y}" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#0f172a">${escapeXml(row.unit)}</text>
  <text x="1065" y="${y}" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#0f172a">${escapeXml(row.discount)}</text>
  <text x="1236" y="${y}" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#0f172a">${escapeXml(row.total)}</text>`;
        })
        .join("\n");

    const extraItems = quote.items.length > rows.length
        ? `<text x="56" y="${tableStartY + 72 + rows.length * rowHeight + 22}" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="#64748b">+ ${quote.items.length - rows.length} item(ns) não exibidos</text>`
        : "";

    const logoMarkup = hasLogo
        ? `<image href="data:image/jpeg;base64,${branding.logoBase64}" x="52" y="50" width="${logoWidth}" height="${logoHeight}" preserveAspectRatio="xMidYMid meet" />`
        : "";

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="${height}" viewBox="0 0 1400 ${height}">
  <rect width="1400" height="${height}" fill="#f4f6fb" />
  <rect x="20" y="20" width="1360" height="${height - 40}" rx="16" fill="#ffffff" stroke="#d9e1ee" />

  <rect x="44" y="44" width="1312" height="${headerHeight}" rx="12" fill="#f8fafc" stroke="#dbe3ef" />
  ${logoMarkup}
  <text x="${hasLogo ? 292 : 56}" y="94" font-family="Segoe UI, Arial, sans-serif" font-size="36" font-weight="700" fill="#0f172a">${escapeXml(branding.companyName)}</text>
  <text x="${hasLogo ? 292 : 56}" y="126" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#475569">Orçamento comercial</text>
  <text x="1088" y="90" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#64748b">Orçamento</text>
  <text x="1088" y="124" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="700" fill="#0f172a">#${quote.id}</text>
  <text x="1088" y="152" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#475569">Status: ${escapeXml(quote.status)}</text>

  <text x="56" y="222" font-family="Segoe UI, Arial, sans-serif" font-size="17" fill="#0f172a">Cliente: ${escapeXml(quote.clientName)}</text>
  <text x="56" y="244" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#334155">Título: ${escapeXml(quote.title || "-")}</text>
  <text x="56" y="266" font-family="Segoe UI, Arial, sans-serif" font-size="14" fill="#64748b">Criado: ${escapeXml(meta.createdAt)} | Vendido: ${escapeXml(meta.soldAt)}</text>

  <rect x="44" y="${tableStartY}" width="1312" height="${tableHeight}" rx="12" fill="#ffffff" stroke="#d9e2ef" />
  <rect x="44" y="${tableStartY}" width="1312" height="44" rx="12" fill="#eef2f8" />
  <text x="56" y="${tableStartY + 28}" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700" fill="#0f172a">Produto</text>
  <text x="850" y="${tableStartY + 28}" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700" fill="#0f172a">Qtd</text>
  <text x="936" y="${tableStartY + 28}" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700" fill="#0f172a">Unitário</text>
  <text x="1065" y="${tableStartY + 28}" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700" fill="#0f172a">Desconto</text>
  <text x="1236" y="${tableStartY + 28}" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700" fill="#0f172a">Total</text>
  ${rowMarkup}
  ${extraItems}

  <rect x="44" y="${infoY}" width="860" height="130" rx="12" fill="#f8fafc" stroke="#e2e8f0" />
  <text x="58" y="${infoY + 30}" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#0f172a">Observações</text>
  <text x="58" y="${infoY + 58}" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#334155">${escapeXml(safeLine(quote.notes || "-", 112))}</text>

  <rect x="924" y="${infoY}" width="432" height="130" rx="12" fill="#f8fafc" stroke="#e2e8f0" />
  <text x="938" y="${infoY + 30}" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#0f172a">Resumo</text>
  <text x="938" y="${infoY + 54}" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="#334155">Total compra: ${escapeXml(brl.format(quote.purchaseTotal))}</text>
  <text x="938" y="${infoY + 74}" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="#334155">Total bruto: ${escapeXml(brl.format(quote.saleGrossTotal))}</text>
  <text x="938" y="${infoY + 94}" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="#334155">Descontos: ${escapeXml(brl.format(quote.itemDiscountTotal + quote.generalDiscountAmount))}</text>
  <text x="938" y="${infoY + 114}" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700" fill="#0f172a">Total líquido: ${escapeXml(brl.format(quote.saleNetTotal))}</text>

  <text x="44" y="${footerY}" font-family="Segoe UI, Arial, sans-serif" font-size="13" fill="#64748b">${escapeXml(branding.companyName)} | Documento gerado automaticamente</text>
</svg>`;
}
