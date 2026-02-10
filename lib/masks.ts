export function onlyDigits(value: string) {
    return value.replace(/\D/g, "");
}

export function formatCpf(digits: string) {
    const d = onlyDigits(digits).slice(0, 11);

    const p1 = d.slice(0, 3);
    const p2 = d.slice(3, 6);
    const p3 = d.slice(6, 9);
    const p4 = d.slice(9, 11);

    if (d.length <= 3) return p1;
    if (d.length <= 6) return `${p1}.${p2}`;
    if (d.length <= 9) return `${p1}.${p2}.${p3}`;
    return `${p1}.${p2}.${p3}-${p4}`;
}

export function formatCnpj(digits: string) {
    const d = onlyDigits(digits).slice(0, 14);

    const p1 = d.slice(0, 2);
    const p2 = d.slice(2, 5);
    const p3 = d.slice(5, 8);
    const p4 = d.slice(8, 12);
    const p5 = d.slice(12, 14);

    if (d.length <= 2) return p1;
    if (d.length <= 5) return `${p1}.${p2}`;
    if (d.length <= 8) return `${p1}.${p2}.${p3}`;
    if (d.length <= 12) return `${p1}.${p2}.${p3}/${p4}`;
    return `${p1}.${p2}.${p3}/${p4}-${p5}`;
}

export function formatCpfCnpj(digits: string) {
    const d = onlyDigits(digits);
    if (d.length <= 11) return formatCpf(d);
    return formatCnpj(d);
}

export function formatCep(digits: string) {
    const d = onlyDigits(digits).slice(0, 8);
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)}-${d.slice(5, 8)}`;
}

export function formatPhone(digits: string) {
    const d = onlyDigits(digits).slice(0, 11);
    if (d.length <= 2) return d;

    const ddd = d.slice(0, 2);
    const rest = d.slice(2);

    if (rest.length <= 4) return `(${ddd}) ${rest}`;
    if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
    return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
}

export function caretPosFromDigitIndex(formatted: string, digitIndex: number) {
    if (digitIndex <= 0) return 0;

    let digitsSeen = 0;
    for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) digitsSeen++;
        if (digitsSeen >= digitIndex) return i + 1;
    }

    return formatted.length;
}
