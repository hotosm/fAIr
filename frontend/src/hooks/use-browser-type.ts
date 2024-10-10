import { useMemo } from "react";


export const useBrowserType = (): { isChrome: boolean } => {
    const isChrome = useMemo<boolean>(() => {
        return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    }, []);

    return { isChrome };
};