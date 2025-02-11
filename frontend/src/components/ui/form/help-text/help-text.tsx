import { cn } from '@/utils';

type HelptextProps = {
  content?: string;
  isValid?: boolean;
  currentLength?: number;
};

const HelpText: React.FC<HelptextProps> = ({ content, isValid, currentLength }) => {

  return (
    <p className={cn(`mt-1 font-medium text-body-3 text-gray ${isValid !== undefined && (currentLength && currentLength > 0 && !isValid && 'text-primary')}`)} slot="help-text">
      {content}
    </p>
  );
};

export default HelpText;
