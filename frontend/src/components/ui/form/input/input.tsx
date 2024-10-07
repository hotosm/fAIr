
import { SlInput } from '@shoelace-style/shoelace/dist/react';
import styles from './input.module.css';

type InputProps = {
  handleInput: (arg: any) => void;
  value: string;
  className?: string;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean
};

const Input: React.FC<InputProps> = ({ handleInput, value, className = '', placeholder = '', clearable = false, disabled = false }) => {

  return (
    <SlInput
      onSlInput={handleInput}
      value={value}
      className={`${className} ${styles.customInput}`}
      placeholder={placeholder}
      clearable={clearable}
      disabled={disabled}
    >
    </SlInput>
  );
};

export default Input;
