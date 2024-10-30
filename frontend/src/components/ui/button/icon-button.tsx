import { ButtonSize, ButtonVariant } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

type ButtonWithIconProps = {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  label: string;
  variant: ButtonVariant;
  prefixIcon?: React.ElementType;
  suffixIcon?: React.ElementType;
  capitalizeText?: boolean;
  className?: string;
  iconClassName?: string;
  disabled?: boolean;
  size?:ButtonSize
};
const ButtonWithIcon: React.FC<ButtonWithIconProps> = ({
  onClick,
  prefixIcon: PrefixIcon,
  suffixIcon: SuffixIcon,
  label,
  variant = "default",
  capitalizeText = true,
  className,
  iconClassName,
  disabled,
  size 
}) => {
  return (
    <div role="button">
      <Button
        variant={variant}
        onClick={onClick}
        capitalizeText={capitalizeText}
        className={className}
        disabled={disabled}
        size={size}
      >
        {PrefixIcon && <PrefixIcon className={cn(`icon ${iconClassName}`)} />}
        <p>{label}</p>
        {SuffixIcon && <SuffixIcon className={cn(`icon ${iconClassName}`)} />}
      </Button>
    </div>
  );
};
export default ButtonWithIcon;
