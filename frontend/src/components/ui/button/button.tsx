import useScreenSize from "@/hooks/use-screen-size";
import { ButtonSize, ButtonVariant } from "@/types";
import { cn } from "@/utils";
import { SlButton } from "@shoelace-style/shoelace/dist/react";
import { Spinner } from "@/components/ui/spinner";
import "./button.css";

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
};
const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  className,
  onClick,
  spinner = false,
  disabled = false,
  uppercase = true,
  size,
  slot,
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
    >
      <div
        className={cn(
          `flex items-center gap-x-2  ${uppercase && "uppercase"} `,
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
