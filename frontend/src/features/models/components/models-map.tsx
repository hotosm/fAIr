import { MAP_STYLE } from '@/config';
import maplibregl, { Map, } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

const mapSourceName = 'models'
const licensedFonts = ['Open Sans Semibold'];

// Inspired by:https://github.com/hotosm/tasking-manager/blob/develop/frontend/src/components/projects/projectsMap


export const maplibreLayerDefn = (map: Map, mapResults: any, handleClickOnModelID: (clickedId: string) => void, disablePoiClick = false) => {

    map.addSource(mapSourceName, {
        type: 'geojson',
        data: mapResults,
        cluster: true,
        clusterRadius: 35,
    });

    map.addLayer({
        id: 'modelsClusters',
        filter: ['has', 'point_count'],
        type: 'circle',
        source: mapSourceName,
        layout: {},
        paint: {
            'circle-color': 'rgba(104,112,127,0.5)',
            'circle-radius': ['step', ['get', 'point_count'], 14, 10, 22, 50, 30, 500, 37],
        },
    });

    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: mapSourceName,
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': licensedFonts,
            'text-size': 16,
        },
        paint: {
            'text-color': '#FFF',
            'text-halo-width': 10,
            'text-halo-blur': 1,
        },
    });

    map.addLayer({
        id: 'projects-unclustered-points',
        type: 'symbol',
        source: mapSourceName,
        filter: ['!', ['has', 'point_count']],
        layout: {
            'text-font': licensedFonts,
            'text-offset': [0, 0.6],
            'text-anchor': 'top',
        },
        paint: {
            'text-color': '#2c3038',
            'text-halo-width': 1,
            'text-halo-color': '#fff',
        },
    });
    map.on('mouseenter', 'models-unclustered-points', () => {
        // Change the cursor style as a UI indicator.
        if (!disablePoiClick) {
            map.getCanvas().style.cursor = 'pointer';
        }
    });
    map.on('mouseleave', 'models-unclustered-points', () => {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = '';
    });

    map.on('click', 'models-unclustered-points', (e: any) => {
        console.log(e.features)
        const value = e.features && e.features[0].properties && e.features[0].properties.projectId;
        handleClickOnModelID(value);
    });
};

type ModelsMapProps = {
    // check the response to create a type for it
    mapResults: any
}
const ModelsMap: React.FC<ModelsMapProps> = ({ mapResults }) => {
    const [mapInstance, setMapInstance] = useState<Map | null>(null);
    const mapRef = useRef(null);

    const handleClickOnModelID = useCallback(
        (clickedModel: string) =>
        // Update the search result query
        //   setQuery(
        //     {
        //       ...fullProjectsQuery,
        //       page: undefined,
        //       text: ['#', projectIdSearch].join(''),
        //     },
        //     'pushIn',
        //   ),
        { console.log(clickedModel) },
        [],
        // fullProjectsQuery, setQuery
    );


    useLayoutEffect(() => {
        // The purpose of using LayoutEffect is to speed up the rendering of the map, when the user toggles on the mapview, 
        // since it runs before the browser is repainted.
        setMapInstance(
            new maplibregl.Map({
                // @ts-ignore
                container: mapRef.current,
                // @ts-ignore
                style: MAP_STYLE,
                center: [0, 0],
                zoom: 0.5
            })
        )
        return () => {
            mapInstance && mapInstance.remove()
        }
    }, [])

    useLayoutEffect(() => {

        const someResultsReady = mapResults && mapResults.features && mapResults.features.length > 0;

        const mapReadyModelsReady =
            mapInstance !== null &&
            mapInstance.isStyleLoaded() &&
            mapInstance.getSource(mapSourceName) === undefined &&
            someResultsReady;

        const modelsReadyMapLoading =
            mapInstance !== null &&
            !mapInstance.isStyleLoaded() &&
            mapInstance.getSource(mapSourceName) === undefined &&
            someResultsReady;

        /* set up style/sources for the map, either immediately or on base load */
        if (mapReadyModelsReady) {
            maplibreLayerDefn(mapInstance, mapResults, handleClickOnModelID);
        } else if (modelsReadyMapLoading) {
            mapInstance.on('load', () => maplibreLayerDefn(mapInstance, mapResults, handleClickOnModelID));
        }

        /* refill the source on mapResults changes */
        // since it's not sure if there'll be a filter, remove this for now.
        // mapInstance.getSource(mapSourceName)?.setData(mapResults);
        // if (mapInstance !== null && mapInstance.getSource(mapSourceName) !== undefined && someResultsReady) {

        // }
    }, [mapInstance, mapResults, handleClickOnModelID]);


    return (
        <div className='h-full w-full' id="map" ref={mapRef}>
        </div>
    )
}

export default ModelsMap