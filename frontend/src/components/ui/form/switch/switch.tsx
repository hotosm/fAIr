import styles from "./switch.module.css";
import { cn } from "@/utils";
import { Switch as SlSwitch } from "@hotosm/ui/components/react/index";

type SwitchProps = {
  disabled?: boolean;
  handleSwitchChange: (args: any) => void;
  checked: boolean;
};
const Switch: React.FC<SwitchProps> = ({
  checked,
  disabled,
  handleSwitchChange,
}) => {
  return (
    <SlSwitch
      checked={checked}
      disabled={disabled}
      onSlChange={handleSwitchChange}
      className={cn(`${styles.customSwitch} ${checked && styles.checked}`)}
    ></SlSwitch>
  );
};

export default Switch;
