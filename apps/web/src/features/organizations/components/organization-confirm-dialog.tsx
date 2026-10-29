import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@ibase/ui/components/ui/alert-dialog';

/** Confirms sensitive organization actions using the shared shadcn dialog. */
export function OrganizationConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-[12px] border-[var(--console-line)] bg-white p-6 text-[var(--console-ink)] shadow-[0_2px_2px_rgba(0,0,0,0.04),0_8px_16px_-4px_rgba(0,0,0,0.08)]">
        <AlertDialogHeader className="gap-2">
          <AlertDialogTitle className="text-[20px] font-semibold leading-7 tracking-[-0.4px]">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-5 text-[var(--console-body)]">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            variant="outline"
            size="lg"
            className="h-11 rounded-[6px] border-[var(--console-line)] bg-white px-1.5 text-sm text-[var(--console-ink)] hover:bg-[var(--console-soft)]"
          >
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            variant="default"
            size="lg"
            className={`h-11 rounded-[6px] px-1.5 text-sm text-white hover:bg-[var(--console-body)] ${
              destructive
                ? 'bg-[var(--console-error)] hover:bg-[var(--console-error-deep)]'
                : 'bg-[var(--console-ink)]'
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
