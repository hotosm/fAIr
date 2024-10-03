import SlButton from "@shoelace-style/shoelace/dist/react/button/index.js";
import "./button.css";
import { Spinner } from "@/components/ui/spinner";
import { AddIcon } from "@/components/ui/icons";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = {
  children: React.ReactNode;
  variant: ButtonVariant;
  className?: string;
  onClick?: () => void;
  spinner?: boolean;
  create?: boolean
};
const Button: React.FC<ButtonProps> = ({
  children,
  variant,
  className,
  onClick,
  spinner = false,
  create = false
}) => {
  const spinnerColor = variant === 'primary' ? 'white' : 'red';
  const trackColor = variant === 'primary' ? 'red' : 'white';

  return (
    <SlButton
      variant="primary"
      size="large"
      className={`button ${variant} ${className}`}
      style={{ width: "100%" }}
      onClick={onClick}
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
