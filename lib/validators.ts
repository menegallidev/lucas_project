export function isValidCpf(cpf: string) {
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) return false;
    if (/^(\d)\1+$/.test(digits)) return false;

    const nums = digits.split("").map((n) => Number(n));

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += nums[i] * (10 - i);
    let check = (sum * 10) % 11;
    if (check === 10) check = 0;
    if (check !== nums[9]) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += nums[i] * (11 - i);
    check = (sum * 10) % 11;
    if (check === 10) check = 0;
    if (check !== nums[10]) return false;

    return true;
}

export function isValidCnpj(cnpj: string) {
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) return false;
    if (/^(\d)\1+$/.test(digits)) return false;

    const nums = digits.split("").map((n) => Number(n));
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) sum += nums[i] * weights1[i];
    let check = sum % 11;
    check = check < 2 ? 0 : 11 - check;
    if (check !== nums[12]) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) sum += nums[i] * weights2[i];
    check = sum % 11;
    check = check < 2 ? 0 : 11 - check;
    if (check !== nums[13]) return false;

    return true;
}

export function isValidCpfCnpj(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 11) return isValidCpf(digits);
    return isValidCnpj(digits);
}
