import { Spinner as SlSpinner } from "@hotosm/ui/components/react/index";

type SpinnerProps = {
  style?: Record<string, string>;
};
const Spinner: React.FC<SpinnerProps> = ({ style }) => (
  <SlSpinner style={style} />
);

export default Spinner;
