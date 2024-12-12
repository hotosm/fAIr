import { useNavigate } from "react-router-dom";
import { ArrowBackIcon } from "@/components/ui/icons";


const BackButton = () => {
  const navigate = useNavigate();

  return (
    <button
      className="flex items-center gap-x-2 mt-10"
      onClick={() => navigate(-1)}
      title="Go back"
    >
      <ArrowBackIcon className="icon w-6 h-6" />
      <span className="text-dark text-body-2">Back</span>
    </button>
  );
};

export default BackButton;
