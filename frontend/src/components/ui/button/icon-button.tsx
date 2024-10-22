import { ButtonSize, ButtonVariant } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

type ButtonWithIconProps = {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  label: string;
  variant: ButtonVariant;
  size?: ButtonSize;
  prefixIcon?: React.ElementType;
  suffixIcon?: React.ElementType;
  capitalizeText?: boolean;
  className?: string;
  iconClassName?: string;
  disabled?: boolean;
};
const ButtonWithIcon: React.FC<ButtonWithIconProps> = ({
  onClick,
  prefixIcon: PrefixIcon,
  suffixIcon: SuffixIcon,
  label,
  variant = "default",
  size = "medium",
  capitalizeText = true,
  className,
  iconClassName,
  disabled,
}) => (
  <div role="button">
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      capitalizeText={capitalizeText}
      className={className}
      disabled={disabled}
    >
      {PrefixIcon && <PrefixIcon className={cn(`icon ${iconClassName}`)} />}
      <span>{label}</span>
      {SuffixIcon && <SuffixIcon className={cn(`icon ${iconClassName}`)} />}
    </Button>
  </div>
);

export default ButtonWithIcon;
