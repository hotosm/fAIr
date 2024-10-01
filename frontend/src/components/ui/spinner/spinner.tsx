import SlSpinner from '@shoelace-style/shoelace/dist/react/spinner/index.js';

type SpinnerProps={
    style:object 
}
const Spinner:React.FC<SpinnerProps> = ({style}) => (
    <SlSpinner style={style} />
);

export default Spinner