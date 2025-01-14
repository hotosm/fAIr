import { SlSpinner } from "@shoelace-style/shoelace/dist/react";

type SpinnerProps = {
  style?: Record<string, string>;
};
const Spinner: React.FC<SpinnerProps> = ({ style }) => (
  <SlSpinner style={style} />
);

export default Spinner;
