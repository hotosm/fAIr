import SlButton from "@shoelace-style/shoelace/dist/react/button/index.js";
import "./button.css";
import { Spinner } from "@/components/ui/spinner";
import { AddIcon } from "@/components/ui/icons";

export type ButtonVariant = "primary" | "secondary" | 'tertiary' | 'default' | 'dark' | 'outline';

export type ButtonSize = 'large' | 'medium' | 'small'


type ButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
  onClick?: (event: any) => void;
  spinner?: boolean;
  create?: boolean
  size?: ButtonSize
  disabled?: boolean
  capitalizeText?: boolean
};
const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className,
  onClick,
  spinner = false,
  create = false,
  size = 'large',
  disabled = false,
  capitalizeText = true
}) => {
  const spinnerColor = variant === 'primary' ? 'white' : 'red';
  const trackColor = variant === 'primary' ? 'red' : 'white';

  return (
    <SlButton
      //@ts-expect-error
      variant={variant}
      size={size}
      className={`button ${variant} ${className} ${capitalizeText && 'capitalize'}`}
      style={{ width: "100%" }}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="flex items-center gap-x-2">
        {
          create &&
          <AddIcon />
        }
        {
          children
        }
        {
          spinner &&
          <Spinner style={{
            '--indicator-color': trackColor,
            '--track-color': spinnerColor
          }} />
        }
      </div>
    </SlButton>
  );
};

export default Button;
