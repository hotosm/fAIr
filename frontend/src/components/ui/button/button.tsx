import useScreenSize from "@/hooks/use-screen-size";
import { ButtonSize } from "@/types";
import { cn } from "@/utils";
import { SlButton } from "@shoelace-style/shoelace/dist/react";
import { Spinner } from "@/components/ui/spinner";
import "./button.css";
import { ButtonVariant } from "@/enums";

type ButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  spinner?: boolean;
  size?: ButtonSize;
  disabled?: boolean;
  slot?: string;
  uppercase?: boolean;
  type?: "button" | "submit";
  contentClassName?: string;
};
const Button: React.FC<ButtonProps> = ({
  children,
  variant = ButtonVariant.PRIMARY,
  className,
  onClick,
  spinner = false,
  disabled = false,
  uppercase = true,
  size,
  slot,
  type = "button",
  contentClassName,
}) => {
  const spinnerColor = variant === "primary" ? "white" : "red";
  const trackColor = variant === "primary" ? "red" : "white";
  const { isMobile } = useScreenSize();
  return (
    <SlButton
      //@ts-expect-error bad type definition
      variant={variant}
      size={size ? size : isMobile ? "medium" : "large"}
      className={cn(`button ${variant} ${className} `)}
      style={{ width: "100%" }}
      //@ts-expect-error bad type definition
      onClick={onClick}
      disabled={disabled}
      slot={slot}
      type={type}
    >
      <div
        className={cn(
          `flex items-center gap-x-2  ${uppercase && "uppercase"} ${contentClassName} `,
        )}
      >
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
