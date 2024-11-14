
import { Map, } from "maplibre-gl";

const MapCursorToolTip = ({ color, tooltipVisible, tooltipPosition, children }: { map: Map | null, color?: string, tooltipPosition: Record<string, number>, tooltipVisible: boolean, children: React.ReactNode }) => {
    if (!tooltipVisible) return null

    return (
        <div
            className={`absolute w-50 text-white px-2 rounded-sm pointer-events-none text-nowrap flex flex-col ${color}`}
            style={{
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y}px`,
            }}
        >
            {children}
        </div>
    )
}

export default MapCursorToolTip