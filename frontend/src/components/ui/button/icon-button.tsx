import { ButtonSize, ButtonVariant } from "@/types";
import { Button } from "@/components/ui/button";

type ButtonWithIconProps = {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  label: string;
  variant: ButtonVariant;
  size?: ButtonSize;
  prefixIcon: React.ElementType;
  suffixIcon?: React.ElementType;
  capitalizeText?: boolean;
  className?: string;
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
}) => (
  <div role="button">
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      capitalizeText={capitalizeText}
      className={className}
    >
      <PrefixIcon className="icon" />
      <span>{label}</span>
      {SuffixIcon && <SuffixIcon className="icon" />}
    </Button>
  </div>
);

export default ButtonWithIcon;
