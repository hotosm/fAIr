import { useMap } from "@/app/providers/map-provider";
import { FitToBounds, MapComponent } from "@/components/map";
import { ControlsPosition } from "@/enums";
import { PMTiles } from "pmtiles";
import { LayerSpecification, MapGeoJSONFeature, MapLayerMouseEvent, Popup } from "maplibre-gl";
import { useEffect, useState } from "react";
import ReactDOMServer from 'react-dom/server';

import {
    TRAINING_AREAS_AOI_FILL_COLOR,
    TRAINING_AREAS_AOI_FILL_OPACITY,
    TRAINING_AREAS_AOI_LABELS_FILL_COLOR,
    TRAINING_AREAS_AOI_LABELS_FILL_OPACITY,
    TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR,
    TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH,
    TRAINING_AREAS_AOI_OUTLINE_COLOR,
    TRAINING_AREAS_AOI_OUTLINE_WIDTH,
} from "@/utils";

type Metadata = {
    name?: string;
    type?: string;
    tilestats?: unknown;
    vector_layers: LayerSpecification[];
};

const getFillConfig = (layerType: string): Record<string, string> => {
    if (layerType === "aois") {
        return {
            "fill-color": TRAINING_AREAS_AOI_FILL_COLOR,
            "fill-opacity": TRAINING_AREAS_AOI_FILL_OPACITY,
        };
    } else {
        return {
            "fill-color": TRAINING_AREAS_AOI_LABELS_FILL_COLOR,
            "fill-opacity": TRAINING_AREAS_AOI_LABELS_FILL_OPACITY,
        };
    }
};

const getOutlineConfig = (layerType: string): Record<string, string> => {
    if (layerType === "aois") {
        return {
            "line-color": TRAINING_AREAS_AOI_OUTLINE_COLOR,
            "line-width": TRAINING_AREAS_AOI_OUTLINE_WIDTH,
        };
    } else {
        return {
            "line-color": TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR,
            "line-width": TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH
        };
    }
};


const FeatureProperties = ({ feature }: { feature: MapGeoJSONFeature }) => {
    return (
        <div className="p-4 w-full overflow-auto">
            <span>
                <strong>{(feature.layer as any)["source-layer"]}</strong>
            </span>
            <table>
                {Object.entries(feature.properties).map(([key, value], i) => (
                    <tr key={i} >
                        <td className="text-gray">{key}</td>
                        <td className="font-semibold text-dark">
                            {typeof value === "boolean" ? JSON.stringify(value) : value}
                        </td>
                    </tr>
                ))}
            </table>
        </div>
    );
};



export const TrainingAreaMap = ({
    file,
    trainingAreaId,
}: {
    file: string;
    trainingAreaId: number;
}) => {

    const { map } = useMap();

    const [bounds, setBounds] = useState<[[number, number], [number, number]]>([
        [0, 0],
        [0, 0],
    ]);
    const [vectorLayers, setVectorLayers] = useState<LayerSpecification[]>([]);

    const trainingAreasSourceId = `training-areas-for-${trainingAreaId}`;

    useEffect(() => {
        if (!map) return
        map.on("load", map.resize);
        map.getCanvas().style.cursor = 'pointer';

        if (!map.getSource(trainingAreasSourceId)) {
            map.addSource(trainingAreasSourceId, {
                type: "vector",
                url: `pmtiles://${file}`,
            });
        }

        const loadPMTiles = async () => {

            const pmtilesFile = new PMTiles(file);
            const header = await pmtilesFile.getHeader();

            // Update bounds in state
            setBounds([
                [header.minLon, header.minLat],
                [header.maxLon, header.maxLat],
            ]);

            // Resize the map before fitting to bounds

            map.fitBounds([
                [header.minLon, header.minLat],
                [header.maxLon, header.maxLat],
            ]);

            // load the layers
            const metadata = (await pmtilesFile.getMetadata()) as Metadata;
            const vectorLayers = metadata.vector_layers;

            setVectorLayers(vectorLayers);

            if (vectorLayers) {
                for (const layer of vectorLayers) {
                    if (
                        !map.getLayer(`${layer.id}_fill`) &&
                        !map.getLayer(`${layer.id}_outline`)
                    ) {
                        map.addLayer({
                            id: `${layer.id}_fill`,
                            type: "fill",
                            source: trainingAreasSourceId,
                            paint: {
                                ...getFillConfig(layer.id),
                            },
                            "source-layer": layer.id,
                            maxzoom: layer.maxzoom,
                            minzoom: layer.minzoom,
                        });
                        map.addLayer({
                            id: `${layer.id}_outline`,
                            type: "line",
                            source: trainingAreasSourceId,
                            paint: {
                                ...getOutlineConfig(layer.id),
                            },
                            "source-layer": layer.id,
                            maxzoom: layer.maxzoom,
                            minzoom: layer.minzoom,
                        });
                    }
                }
            }
        };
        loadPMTiles();
    }, [map]);


    useEffect(() => {
        if (!map) return
        const handleMouseClick = (e: MapLayerMouseEvent) => {
            const { lngLat } = e;
            const { x, y } = e.point;

            const r = 2; // radius around the point

            const features = map.queryRenderedFeatures([
                [x - r, y - r],
                [x + r, y + r],
            ]);

            if (!features || !features.length) return;

            const clickedFeatures = features.filter(
                (feature) => feature.source === trainingAreasSourceId
            );

            const popup = new Popup({ closeButton: false })
                .setLngLat(lngLat)

            if (clickedFeatures.length) {
                const feature = clickedFeatures[0];
                const html = ReactDOMServer.renderToString(<FeatureProperties feature={feature} />);
                popup.setHTML(html)
                    .addTo(map);

            } else {
                popup.remove()
            }

        }
        map.on('click', handleMouseClick)
    }, [map]);


    const fitToBounds = () => {
        map?.fitBounds(bounds);
    };


    return (
        <MapComponent
            pmtiles
            layerControl
            controlsPosition={ControlsPosition.TOP_LEFT}
            basemaps
            layerControlLayers={vectorLayers.map((layer) => ({
                value: `Training ${layer.id}`,
                subLayers: [`${layer.id}_fill`, `${layer.id}_outline`],
            }))}
        >
            <FitToBounds onClick={fitToBounds} />
        </MapComponent>
    );
};
