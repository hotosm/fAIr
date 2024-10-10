import { useCallback, useState } from "react";

export const useDialog = () => {
    const [isOpened, setIsOpened] = useState(false);

    const toggle = useCallback(() => {
        setIsOpened((prev) => !prev);
    }, []);

    return { isOpened, toggle };
};