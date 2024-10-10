import { useEffect, useRef, useState, } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLE } from '@/config';
import ZoomControls from './zoom-controls';
import GeolocationControl from './geolocation-control';
import LayoutControl from './layout-control';


type MapComponentProps = {
    onMapLoad: (map: Map) => void;
    layoutControl?: boolean
    geolocationControl?: boolean
};

const MapComponent: React.FC<MapComponentProps> = ({ onMapLoad, geolocationControl = false, layoutControl = false }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState<Map | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        const map = new maplibregl.Map({
            container: mapRef.current,
            //@ts-ignore
            style: MAP_STYLE,
            center: [0, 0],
            zoom: 0.5,
            minZoom: 1,
            maxZoom: 18,
        });
        onMapLoad(map);
        setMap(map);
        return () => map.remove();
    }, []);

    return (
        <div className="h-full w-full relative" ref={mapRef}>
            <div className='absolute top-5 right-3 z-[10] flex flex-col gap-y-[1px]'>
                <ZoomControls map={map} />
                {
                    geolocationControl && <GeolocationControl map={map} />
                }
                {
                    layoutControl && <LayoutControl map={map} />
                }
            </div>

        </div>
    )
};

export default MapComponent;
