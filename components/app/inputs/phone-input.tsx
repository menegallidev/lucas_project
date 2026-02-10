"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { caretPosFromDigitIndex, formatPhone, onlyDigits } from "@/lib/masks";

type Props = Omit<React.ComponentProps<typeof Input>, "onChange" | "value" | "name"> & {
    name: string;
    value?: string;
    onChange?: (digits: string) => void;
};

export const PhoneInput = React.forwardRef<HTMLInputElement, Props>(
    ({ value, onChange, name, id, ...props }, ref) => {
        const innerRef = React.useRef<HTMLInputElement | null>(null);
        React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

        const isControlled = value !== undefined;
        const [digitsState, setDigitsState] = React.useState("");

        const digits = React.useMemo(() => {
            const raw = isControlled ? String(value ?? "") : digitsState;
            return onlyDigits(raw).slice(0, 11);
        }, [isControlled, value, digitsState]);

        const formattedValue = React.useMemo(() => formatPhone(digits), [digits]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const el = e.currentTarget;
            const cursorPos = el.selectionStart ?? el.value.length;
            const digitsBeforeCursor = onlyDigits(el.value.slice(0, cursorPos)).length;

            const nextDigits = onlyDigits(el.value).slice(0, 11);
            const nextFormatted = formatPhone(nextDigits);

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
                    maxLength={15}
                    value={formattedValue}
                    onChange={handleChange}
                />
                <input type="hidden" name={name} value={digits} />
            </>
        );
    }
);

PhoneInput.displayName = "PhoneInput";
