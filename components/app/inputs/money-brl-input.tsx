"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

type Props = Omit<React.ComponentProps<typeof Input>, "onChange" | "value" | "name"> & {
    name: string;
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
};

function withPrefix(value: string) {
    const raw = String(value ?? "").replace(/^R\$\s*/i, "").trim();
    if (!raw) return "";
    return `R$ ${raw}`;
}

function sanitizeTyped(value: string) {
    return String(value ?? "")
        .replace(/^R\$\s*/i, "")
        .replace(/[^\d,.-]/g, "");
}

function toDecimal(value: string) {
    const typed = sanitizeTyped(value);
    if (!typed) return "";

    const lastComma = typed.lastIndexOf(",");
    const lastDot = typed.lastIndexOf(".");
    const sepIndex = Math.max(lastComma, lastDot);

    if (sepIndex < 0) {
        const intPart = typed.replace(/\D/g, "");
        return intPart || "";
    }

    const intPart = typed.slice(0, sepIndex).replace(/\D/g, "");
    const fracPart = typed.slice(sepIndex + 1).replace(/\D/g, "");

    if (!intPart && !fracPart) return "";
    if (!fracPart) return intPart || "0";

    return `${intPart || "0"}.${fracPart}`;
}

export const MoneyBrlInput = React.forwardRef<HTMLInputElement, Props>(
    ({ value, defaultValue, onChange, name, id, ...props }, ref) => {
        const innerRef = React.useRef<HTMLInputElement | null>(null);
        React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

        const isControlled = value !== undefined;
        const [displayState, setDisplayState] = React.useState(() => withPrefix(String(defaultValue ?? "")));

        React.useEffect(() => {
            if (!isControlled) return;
            setDisplayState(withPrefix(String(value ?? "")));
        }, [isControlled, value]);

        const visibleValue = isControlled ? withPrefix(String(value ?? "")) : displayState;
        const decimalValue = toDecimal(visibleValue);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const nextSanitized = sanitizeTyped(e.currentTarget.value);
            const nextVisible = withPrefix(nextSanitized);

            if (!isControlled) {
                setDisplayState(nextVisible);
            }

            onChange?.(nextSanitized);

            requestAnimationFrame(() => {
                const input = innerRef.current;
                if (!input) return;
                const end = input.value.length;
                input.setSelectionRange(end, end);
            });
        };

        return (
            <>
                <Input
                    {...props}
                    id={id}
                    type="text"
                    ref={innerRef}
                    inputMode="decimal"
                    autoComplete="off"
                    value={visibleValue}
                    onChange={handleChange}
                />
                <input type="hidden" name={name} value={decimalValue} />
            </>
        );
    }
);

MoneyBrlInput.displayName = "MoneyBrlInput";
