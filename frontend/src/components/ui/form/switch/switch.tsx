import styles from "./switch.module.css";
import { cn } from "@/utils";
import { SlChangeEvent } from "@shoelace-style/shoelace";
import { SlSwitch } from "@shoelace-style/shoelace/dist/react";

type SwitchProps = {
  disabled?: boolean;
  handleSwitchChange: (args: SlChangeEvent) => void;
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
