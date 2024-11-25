type HelptextProps = {
  content?: string;
};

const HelpText: React.FC<HelptextProps> = ({ content }) => {
  return (
    <p className="mt-1 text-sm text-gray" slot="help-text">
      {content}
    </p>
  );
};

export default HelpText;
