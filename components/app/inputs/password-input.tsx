"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
    wrapperClassName?: string;
};

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, wrapperClassName, ...props }, ref) => {
        const [show, setShow] = React.useState(false);

        return (
            <div className={cn("relative", wrapperClassName)}>
                <Input
                    {...props}
                    ref={ref}
                    type={show ? "text" : "password"}
                    className={cn("pr-10", className)}
                />

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
            </div>
        );
    }
);

PasswordInput.displayName = "PasswordInput";
