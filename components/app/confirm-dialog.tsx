"use client";

import * as React from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
    trigger: React.ReactNode;

    title?: string;
    description: React.ReactNode;

    confirmText?: string;
    cancelText?: string;

    onConfirm: () => void | Promise<void>;

    open?: boolean;
    onOpenChange?: (open: boolean) => void;

    contentClassName?: string;

    closeOnConfirm?: boolean;

    disableCancelWhilePending?: boolean;

    confirmVariantClassName?: string;
};

export function ConfirmDialog({
    trigger,
    title = "Confirmar ação",
    description,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    onConfirm,
    open,
    onOpenChange,
    contentClassName,
    closeOnConfirm = true,
    disableCancelWhilePending = true,
    confirmVariantClassName,
}: ConfirmDialogProps) {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const [pending, setPending] = React.useState(false);

    const isControlled = open !== undefined && onOpenChange !== undefined;
    const isOpen = isControlled ? open : internalOpen;

    const setOpen = (v: boolean) => {
        if (isControlled) onOpenChange(v);
        else setInternalOpen(v);
    };

    const handleConfirm = async () => {
        try {
            setPending(true);
            await onConfirm();
            if (closeOnConfirm) setOpen(false);
        } finally {
            setPending(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>

            <AlertDialogContent className={contentClassName}>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={disableCancelWhilePending && pending}>
                        {cancelText}
                    </AlertDialogCancel>

                    <AlertDialogAction
                        onClick={(e: { preventDefault: () => void; }) => {
                            e.preventDefault();
                            void handleConfirm();
                        }}
                        className={cn(confirmVariantClassName)}
                        disabled={pending}
                    >
                        {pending ? "Aguarde..." : confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
