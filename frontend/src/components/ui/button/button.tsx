import SlButton from "@shoelace-style/shoelace/dist/react/button/index.js";
import "./button.css";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/utils";
import { ButtonSize, ButtonVariant } from "@/types";
import useDevice from "@/hooks/use-device";

type ButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  spinner?: boolean;
  size?: ButtonSize;
  disabled?: boolean;
  capitalizeText?: boolean;
  slot?: string;
};
const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  className,
  onClick,
  spinner = false,
  disabled = false,
  capitalizeText = true,
  slot,
}) => {
  const spinnerColor = variant === "primary" ? "white" : "red";
  const trackColor = variant === "primary" ? "red" : "white";
  const isMobile = useDevice();
  return (
    <SlButton
      //@ts-expect-error bad type definition
      variant={variant}
      size={isMobile ? "medium" : "large"}
      className={cn(
        `button ${variant} ${capitalizeText && "capitalize"} ${className} `,
      )}
      style={{ width: "100%" }}
      //@ts-expect-error bad type definition
      onClick={onClick}
      disabled={disabled}
      slot={slot}
    >
      <div className="flex items-center gap-x-2">
        {children}
        {spinner && (
          <Spinner
            style={{
              "--indicator-color": trackColor,
              "--track-color": spinnerColor,
            }}
          />
        )}
      </div>
    </SlButton>
  );
};

export default Button;
