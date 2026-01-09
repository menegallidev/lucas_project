"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { caretPosFromDigitIndex, formatCpf, onlyDigits } from "@/lib/masks";

type Props = Omit<React.ComponentProps<typeof Input>, "onChange" | "value" | "name"> & {
    /**
     * Nome do campo que será enviado no <form> (com dígitos).
     * Ex: name="cpf"
     */
    name: string;

    /**
     * Se você passar value/onChange, vira controlado.
     * value pode ser dígitos OU formatado; a gente normaliza.
     */
    value?: string;

    /**
     * onChange recebe SEMPRE os dígitos (11).
     */
    onChange?: (digits: string) => void;
};

export const CpfInput = React.forwardRef<HTMLInputElement, Props>(
    ({ value, onChange, name, id, ...props }, ref) => {
        const innerRef = React.useRef<HTMLInputElement | null>(null);
        React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

        const isControlled = value !== undefined;

        // estado interno mantém dígitos (não formatado)
        const [digitsState, setDigitsState] = React.useState("");

        // dígitos atuais (controlado ou interno)
        const digits = React.useMemo(() => {
            const raw = isControlled ? String(value ?? "") : digitsState;
            return onlyDigits(raw).slice(0, 11);
        }, [isControlled, value, digitsState]);

        // o que aparece pro usuário
        const formattedValue = React.useMemo(() => formatCpf(digits), [digits]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const el = e.currentTarget;

            // cursor -> quantos dígitos existiam antes dele
            const cursorPos = el.selectionStart ?? el.value.length;
            const digitsBeforeCursor = onlyDigits(el.value.slice(0, cursorPos)).length;

            const nextDigits = onlyDigits(el.value).slice(0, 11);
            const nextFormatted = formatCpf(nextDigits);

            if (!isControlled) setDigitsState(nextDigits);
            onChange?.(nextDigits);

            requestAnimationFrame(() => {
                const input = innerRef.current;
                if (!input) return;
                const nextCursor = caretPosFromDigitIndex(nextFormatted, digitsBeforeCursor);
                input.setSelectionRange(nextCursor, nextCursor);
            });
        };

        return (
            <>
                {/* ✅ Campo visível (não tem name, então não é enviado no form) */}
                <Input
                    {...props}
                    id={id}
                    ref={innerRef}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={14}
                    value={formattedValue}
                    onChange={handleChange}
                />

                {/* ✅ Campo que será enviado no form (somente dígitos) */}
                <input type="hidden" name={name} value={digits} />
            </>
        );
    }
);

CpfInput.displayName = "CpfInput";
