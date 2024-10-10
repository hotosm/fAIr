import { Map } from "maplibre-gl";
import { useCallback, useEffect, useState } from "react";

const ZoomButton = ({
    onClick,
    disabled,
    svgPath,
}: {
    onClick: () => void;
    disabled: boolean;
    svgPath: string;
}) => (
    <button
        className={`p-2 bg-white flex items-center justify-center ${disabled ? 'text-gray-border cursor-not-allowed' : 'text-dark'}`}
        onClick={onClick}
        disabled={disabled}
    >
        <svg className="w-3.5 h-3.5" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d={svgPath} fill="currentColor" />
        </svg>
    </button>
);

const ZoomControls = ({ map }: { map: Map | null }) => {
    const [zoomLevel, setZoomLevel] = useState<number | null>(null);

    useEffect(() => {
        if (!map) return;
        setZoomLevel(map.getZoom());
        const handleZoomChange = () => setZoomLevel(map.getZoom());
        map.on("zoomend", handleZoomChange);
        return () => {
            map.off("zoomend", handleZoomChange);
        };
    }, [map]);

    const handleZoomIn = useCallback(() => {
        if (map && zoomLevel !== null && zoomLevel < map.getMaxZoom()) {
            map.zoomIn();
        }
    }, [map, zoomLevel]);

    const handleZoomOut = useCallback(() => {
        if (map && zoomLevel !== null && zoomLevel > map.getMinZoom()) {
            map.zoomOut();
        }
    }, [map, zoomLevel]);

    if (!map) return null;

    return (
        <div className="flex flex-col gap-y-[1px]">
            <ZoomButton
                onClick={handleZoomIn}
                disabled={zoomLevel === map.getMaxZoom()}
                svgPath="M9.44141 4C9.85562 4 10.1914 4.33579 10.1914 4.75V8.25H13.6914C14.1056 8.25 14.4414 8.58579 14.4414 9C14.4414 9.41421 14.1056 9.75 13.6914 9.75H10.1914V13.25C10.1914 13.6642 9.85562 14 9.44141 14C9.02719 14 8.69141 13.6642 8.69141 13.25V9.75H5.19141C4.77719 9.75 4.44141 9.41421 4.44141 9C4.44141 8.58579 4.77719 8.25 5.19141 8.25H8.69141V4.75C8.69141 4.33579 9.02719 4 9.44141 4ZM0.441406 3.25C0.441406 1.45507 1.89648 0 3.69141 0H15.1914C16.9863 0 18.4414 1.45507 18.4414 3.25V14.75C18.4414 16.5449 16.9863 18 15.1914 18H3.69141C1.89648 18 0.441406 16.5449 0.441406 14.75V3.25ZM3.69141 1.5C2.72491 1.5 1.94141 2.2835 1.94141 3.25V14.75C1.94141 15.7165 2.72491 16.5 3.69141 16.5H15.1914C16.1579 16.5 16.9414 15.7165 16.9414 14.75V3.25C16.9414 2.2835 16.1579 1.5 15.1914 1.5H3.69141Z"
            />
            <ZoomButton
                onClick={handleZoomOut}
                disabled={zoomLevel === map.getMinZoom()}
                svgPath="M13.6914 8.25H5.19141C4.77741 8.25 4.44141 8.586 4.44141 9C4.44141 9.414 4.77741 9.75 5.19141 9.75H13.6914C14.1054 9.75 14.4414 9.414 14.4414 9C14.4414 8.586 14.1054 8.25 13.6914 8.25ZM3.69141 0C1.89648 0 0.441406 1.45507 0.441406 3.25V14.75C0.441406 16.5449 1.89648 18 3.69141 18H15.1914C16.9863 18 18.4414 16.5449 18.4414 14.75V3.25C18.4414 1.45507 16.9863 0 15.1914 0H3.69141ZM1.94141 3.25C1.94141 2.2835 2.72491 1.5 3.69141 1.5H15.1914C16.1579 1.5 16.9414 2.2835 16.9414 3.25V14.75C16.9414 15.7165 16.1579 16.5 15.1914 16.5H3.69141C2.72491 16.5 1.94141 15.7165 1.94141 14.75V3.25Z"
            />
        </div>
    );
};

export default ZoomControls;
