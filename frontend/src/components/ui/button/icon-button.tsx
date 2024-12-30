import { Button } from '@/components/ui/button';
import { ButtonSize, ButtonVariant } from '@/types';
import { cn } from '@/utils';

type ButtonWithIconProps = {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  label: string;
  variant: ButtonVariant;
  prefixIcon?: React.ElementType;
  suffixIcon?: React.ElementType;
  textClassName?: string;
  className?: string;
  iconClassName?: string;
  disabled?: boolean;
  size?: ButtonSize;
  uppercase?: boolean;
};
const ButtonWithIcon: React.FC<ButtonWithIconProps> = ({
  onClick,
  prefixIcon: PrefixIcon,
  suffixIcon: SuffixIcon,
  label,
  variant = "default",
  className,
  iconClassName,
  disabled,
  size,
  uppercase,
  textClassName,
}) => {
  return (
    <div role="button">
      <Button
        variant={variant}
        onClick={onClick}
        className={className}
        disabled={disabled}
        size={size}
        uppercase={uppercase}
      >
        {PrefixIcon && <PrefixIcon className={cn(`icon ${iconClassName}`)} />}
        <p className={textClassName}>{label}</p>
        {SuffixIcon && <SuffixIcon className={cn(`icon ${iconClassName}`)} />}
      </Button>
    </div>
  );
};
export default ButtonWithIcon;
