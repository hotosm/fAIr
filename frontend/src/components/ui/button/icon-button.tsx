import Button, { ButtonSize, ButtonVariant } from "./button";


const IconButton = ({
    onClick,
    prefixIcon: PrefixIcon,
    suffixIcon: SuffixIcon,
    label,
    variant = 'default',
    size = "medium",
    capitalizeText = true
}: {
    onClick?: () => void;
    label: string;
    variant: ButtonVariant;
    size: ButtonSize,
    prefixIcon: React.ElementType;
    suffixIcon?: React.ElementType;
    capitalizeText?: boolean
}) => (

    <div>
        <Button variant={variant} size={size} onClick={onClick} capitalizeText={capitalizeText}>
            <PrefixIcon className="w-4 h-4" />
            <p>{label}</p>
            {SuffixIcon && <SuffixIcon className="w-4 h-4" />}
        </Button>
    </div>
);


export default IconButton