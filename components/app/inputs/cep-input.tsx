"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { caretPosFromDigitIndex, formatCep, onlyDigits } from "@/lib/masks";

type Props = Omit<React.ComponentProps<typeof Input>, "onChange" | "value" | "name"> & {
    name: string;
    value?: string;
    onChange?: (digits: string) => void;
};

export const CepInput = React.forwardRef<HTMLInputElement, Props>(
    ({ value, onChange, name, id, ...props }, ref) => {
        const innerRef = React.useRef<HTMLInputElement | null>(null);
        React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

        const isControlled = value !== undefined;
        const [digitsState, setDigitsState] = React.useState("");

        const digits = React.useMemo(() => {
            const raw = isControlled ? String(value ?? "") : digitsState;
            return onlyDigits(raw).slice(0, 8);
        }, [isControlled, value, digitsState]);

        const formattedValue = React.useMemo(() => formatCep(digits), [digits]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const el = e.currentTarget;
            const cursorPos = el.selectionStart ?? el.value.length;
            const digitsBeforeCursor = onlyDigits(el.value.slice(0, cursorPos)).length;

            const nextDigits = onlyDigits(el.value).slice(0, 8);
            const nextFormatted = formatCep(nextDigits);

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
                <Input
                    {...props}
                    id={id}
                    ref={innerRef}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={9}
                    value={formattedValue}
                    onChange={handleChange}
                />
                <input type="hidden" name={name} value={digits} />
            </>
        );
    }
);

CepInput.displayName = "CepInput";
