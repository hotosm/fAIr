type HelptextProps = {
  content?: string;
  isValid?: boolean;
  currentLength?: number;
  children?: React.ReactNode;
  helpTextClassName?: string;
};

const HelpText: React.FC<HelptextProps> = ({
  content,
  isValid,
  currentLength,
  children,
}) => {
  return (
    <p
      className={` font-medium text-xs text-grey text-wrap ${isValid !== undefined && currentLength && currentLength > 0 && !isValid && "text-primary"}`}
      slot="help-text"
    >
      {content ?? children}
    </p>
  );
};

export default HelpText;
