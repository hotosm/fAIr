
import SlDialog from '@shoelace-style/shoelace/dist/react/dialog/index.js';
import './dialog.css';


type DialogProps = {
  label?: string
  isOpened: boolean
  setOpen: () => void
  children: React.ReactNode
  size?: 'small' | 'medium' | 'large' | 'extra-large'
}
const Dialog: React.FC<DialogProps> = ({ isOpened, setOpen, label, children, size = 'medium' }) => {

  return (
    <SlDialog label={label}
      open={isOpened}
      onSlAfterHide={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setOpen();
      }}
      //@ts-expect-error
      style={{ '--width': size === 'small' ? '25vw' : size === 'medium' ? '50vw' : size === 'extra-large' ? '100vw' : '75vw' }}>
      {children}
    </SlDialog>
  );
};

export default Dialog;