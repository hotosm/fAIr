type HelptextProps = {
  content?: string;
};

const HelpText: React.FC<HelptextProps> = ({ content }) => {
  return (
    <p className="mt-1 font-light text-body-3 text-gray" slot="help-text">
      {content}
    </p>
  );
};

export default HelpText;
