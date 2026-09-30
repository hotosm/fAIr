import { ButtonHTMLAttributes } from "react";

export type SolidButtonVariant = "dark" | "grey" | "primary";

const VARIANT_CLASSES: Record<SolidButtonVariant, string> = {
  dark: "bg-dark",
  grey: "bg-grey",
  primary: "bg-primary",
};

interface SolidButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: SolidButtonVariant;
}

export const SolidButton = ({
  variant = "dark",
  className = "",
  type = "button",
  ...props
}: SolidButtonProps) => (
  <button
    type={type}
    className={`${VARIANT_CLASSES[variant]} text-xs px-3 flex shrink-0 items-center whitespace-nowrap text-white !w-fit !h-8 md:min-w-fit !rounded-md min-w-[7.5rem] ${className}`}
    {...props}
  />
);
