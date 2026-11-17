import { ArrowBackIcon } from "@/components/ui/icons";
import { useHistory } from "@/hooks/use-history";

const BackButton = ({
  className,
  showText,
}: {
  className?: string;
  showText?: boolean;
}) => {
  const { goBack } = useHistory();
  return (
    <button
      className={`flex items-center gap-x-2 ${className}`}
      onClick={goBack}
      title="Go back"
    >
      <ArrowBackIcon className="icon md:icon-lg" />
      {showText && <span className={`text-dark text-body-3`}>Back</span>}
    </button>
  );
};

export default BackButton;
