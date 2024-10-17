import Button, { ButtonSize, ButtonVariant } from "./button";


const ButtonWithIcon = ({
    onClick,
    prefixIcon: PrefixIcon,
    suffixIcon: SuffixIcon,
    label,
    variant = 'default',
    size = "medium",
    capitalizeText = true,
    className
}: {
    onClick?: () => void;
    label: string;
    variant: ButtonVariant;
    size?: ButtonSize,
    prefixIcon: React.ElementType;
    suffixIcon?: React.ElementType;
    capitalizeText?: boolean;
    className?: string;
}) => (

    <div role="button">
        <Button variant={variant} size={size} onClick={onClick} capitalizeText={capitalizeText} className={className}>
            <PrefixIcon className="icon" />
            <span>{label}</span>
            {SuffixIcon && <SuffixIcon className="icon" />}
        </Button>
    </div>
);


export default ButtonWithIcon