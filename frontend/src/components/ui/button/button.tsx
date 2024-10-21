import SlButton from "@shoelace-style/shoelace/dist/react/button/index.js";
import "./button.css";
import { Spinner } from "@/components/ui/spinner";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "default"
  | "dark";

export type ButtonSize = "large" | "medium" | "small";

type ButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
  onClick?: (event: any) => void;
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
  size = "large",
  disabled = false,
  capitalizeText = true,
  slot,
}) => {
  const spinnerColor = variant === "primary" ? "white" : "red";
  const trackColor = variant === "primary" ? "red" : "white";

  return (
    <SlButton
      //@ts-expect-error bad type definition
      variant={variant}
      size={size}
      className={`button ${variant} ${className} ${capitalizeText && "capitalize"}`}
      style={{ width: "100%" }}
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
