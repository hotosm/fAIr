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
      className={`mt-1 text-wrap text-body-4 font-medium text-grey md:text-body-3 ${isValid !== undefined && currentLength && currentLength > 0 && !isValid && "text-primary"}`}
      slot="help-text"
    >
      {content ?? children}
    </p>
  );
};

export default HelpText;
