import type { HTMLAttributes, LabelHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

/** Groups a label, control, description, and validation message. */
export function Field({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('grid gap-2', className)} {...props} />;
}

/** Label associated with a field control. */
export function FieldLabel({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-sm font-medium leading-none', className)}
      {...props}
    />
  );
}

/** Displays field validation messages below the control. */
export function FieldError({
  className,
  errors,
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { errors?: string[] }) {
  if (!errors?.length) return null;

  return (
    <p
      className={cn('text-sm text-destructive', className)}
      role="alert"
      {...props}
    >
      {errors[0]}
    </p>
  );
}
