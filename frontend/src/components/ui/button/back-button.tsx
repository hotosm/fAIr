import { ArrowBackIcon } from "@/components/ui/icons";
import { useHistory } from "@/hooks/use-history";

const BackButton = ({ className }: { className?: string }) => {
  const { goBack } = useHistory();
  return (
    <button
      className={`flex items-center gap-x-2 ${className}`}
      onClick={goBack}
      title="Go back"
    >
      <ArrowBackIcon className="icon md:icon-lg" />
      <span className={`text-body-3 text-dark`}>Back</span>
    </button>
  );
};

export default BackButton;
