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

export function caretPosFromDigitIndex(formatted: string, digitIndex: number) {
    if (digitIndex <= 0) return 0;

    let digitsSeen = 0;
    for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) digitsSeen++;
        if (digitsSeen >= digitIndex) return i + 1;
    }

    return formatted.length;
}
