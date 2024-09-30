import SlButton from "@shoelace-style/shoelace/dist/react/button/index.js";
import "./button.css";
import { Spinner } from "../spinner";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = {
  children: React.ReactNode;
  variant: ButtonVariant;
  className?: string;
  onClick?: () => void;
  spinner?:boolean
};
const Button: React.FC<ButtonProps> = ({
  children,
  variant,
  className,
  onClick,
  spinner=false 
}) => {
  const spinnerColor = variant === 'primary' ? 'white' :'red';
  const trackColor = variant === 'primary' ? 'red' :'white';

  return (
    <SlButton
      variant="primary"
      size="large"
      className={`button ${variant} ${className}`}
      style={{ width: "100%" }}
      onClick={onClick}
    >
      {
       children
      }   
      {
         spinner && 
         <Spinner style={{
           '--indicator-color': trackColor,
           '--track-color': spinnerColor
         }}/>
      }   
    </SlButton>
  );
};

export default Button;
