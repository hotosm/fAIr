import { useEffect, useRef, } from 'react';
import SlAlert from '@shoelace-style/shoelace/dist/react/alert/index.js';



const Alert = ({ message }: { message: string }) => {
    const ref = useRef(null);

    useEffect(() => {
        ref?.current.toast();
    }, [message])

    return (
        <SlAlert ref={ref} variant="primary" duration={3000} closable>
            <strong>{message}</strong>
        </SlAlert>
    );
};

export default Alert