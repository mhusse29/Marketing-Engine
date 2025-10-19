import * as React from "react"
import { useState } from "react"
import { cn } from "../../lib/format"
import { Error } from "@/components/ui/error"
import clsx from "clsx"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  size?: "xSmall" | "small" | "mediumSmall" | "large";
  variant?: "default" | "shugar";
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, size, variant = "default", value: controlledValue, onChange, ...props }, ref) => {
    const [_value, set_value] = useState(controlledValue);

    const _onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      set_value(e.target.value);
      if (onChange) {
        onChange(e);
      }
    };

    // Shugar variant
    if (variant === "shugar") {
      return (
        <div className="w-full flex flex-col gap-2">
          <textarea
            className={clsx(
              "rounded-md resize-none font-sans bg-background-100 text-geist-foreground placeholder:text-gray-900 outline-none w-full duration-150 border border-gray-alpha-400 hover:border-gray-alpha-500 hover:ring-0",
              size === "large" ? "h-12 py-2.5 px-3 text-base" : "h-10 p-2.5 text-sm",
              props.disabled && "bg-gray-100 text-gray-700 placeholder:text-gray-700 placeholder:opacity-50 cursor-not-allowed",
              error ? "ring-red-300 ring-4 border-red-900 text-error" : "focus:border-gray-alpha-600 focus:shadow-focus-input",
              className
            )}
            disabled={props.disabled}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            value={_value}
            onChange={_onChange}
            ref={ref}
            {...props}
          />
          {error && <Error size={size === "large" ? "large" : "small"}>{error}</Error>}
        </div>
      );
    }

    // Default variant (shadcn style)
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        value={controlledValue}
        onChange={onChange}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }


