import { ArrowBackIcon } from "@/components/ui/icons";
import { useNavigate } from "react-router-dom";

const BackButton = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  return (
    <button
      className={`flex items-center gap-x-2 ${className}`}
      onClick={() => navigate(-1)}
      title="Go back"
    >
      <ArrowBackIcon className="icon md:icon-lg" />
      <span className={`text-dark text-body-3`}>Back</span>
    </button>
  );
};

export default BackButton;
