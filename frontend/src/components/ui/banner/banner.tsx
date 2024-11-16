import { useLocalStorage } from "@/hooks/use-storage";
import { HOT_FAIR_BANNER_LOCAL_STORAGE_KEY } from "@/utils";
import { useEffect, useState } from "react";

const Banner = () => {

    const { getValue, setValue } = useLocalStorage();
    const [isBannerVisible, setIsBannerVisible] = useState(true);
    //todo - fetch banner markdown when api is back up.

    useEffect(() => {
        const storedState = getValue(HOT_FAIR_BANNER_LOCAL_STORAGE_KEY);
        if (storedState !== null) {
            setIsBannerVisible(!storedState);
        }
    }, [getValue]);

    const handleCloseBanner = () => {
        setIsBannerVisible(false);
        setValue(HOT_FAIR_BANNER_LOCAL_STORAGE_KEY, "true");
    };

    if (!isBannerVisible) {
        return null;
    }

    return (
        <div className="w-full h-10 bg-primary flex items-center justify-between px-4">
            <span>Markdown here</span>
            <button onClick={handleCloseBanner} className="text-white font-bold">
                ✕
            </button>
        </div>
    );
};

export default Banner;
