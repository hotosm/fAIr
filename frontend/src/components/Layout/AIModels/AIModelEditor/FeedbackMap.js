import React, { useState, useEffect, useContext } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "../../../../axios";
import AuthContext from "../../../../Context/AuthContext";

const FeedbackMap = ({ feedbackData, sourceImagery }) => {
  const { accessToken } = useContext(AuthContext);
  const [mapData, setMapData] = useState(feedbackData);

  useEffect(() => {
    if (feedbackData?.features?.length > 0) {
      setMapData(feedbackData);
    }
  }, [feedbackData]);
  const [geoJSONLayer, setGeoJSONLayer] = useState(null);

  useEffect(() => {
    if (mapData?.features?.length > 0) {
      const geoJSON = new L.GeoJSON(mapData, {
        onEachFeature: (feature, layer) => {
          const validated = feature.properties.validated || false;
          const color = validated ? "green" : "red";
          layer.setStyle({
            color: color,
          });
          layer.bindPopup(`
            Action: <strong>${feature.properties.action}</strong><br>
            Created at: <strong>${new Date(
              feature.properties.created_at
            ).toLocaleString()}</strong><br>
            <button id="validate-${
              feature.properties.id
            }" class="feedback-button">${
            validated ? "Invalidate" : "Validate"
          }</button>
            <button id="discard-${
              feature.properties.id
            }" class="feedback-button">Discard</button>
          `);

          layer.on("popupopen", () => {
            const validateButtonElement = document.getElementById(
              `validate-${feature.properties.id}`
            );
            validateButtonElement.addEventListener("click", () => {
              const id = feature.properties.id;
              const newValidated = !validated;
              axios
                .patch(
                  `/feedback/${id}/`,
                  { validated: newValidated },
                  { headers: { "access-token": accessToken } }
                )
                .then(() => {
                  feature.properties.validated = newValidated;
                  layer.setStyle({ color: newValidated ? "green" : "red" });
                  validateButtonElement.innerHTML = newValidated
                    ? "Invalidate"
                    : "Validate";
                })
                .catch((error) => console.error(error));
            });

            const deleteButtonElement = document.getElementById(
              `discard-${feature.properties.id}`
            );
            deleteButtonElement.addEventListener("click", () => {
              const id = feature.properties.id;
              axios
                .delete(`/feedback/${id}/`, {
                  headers: { "access-token": accessToken },
                })
                .then(() => {
                  const filteredFeatures = mapData.features.filter(
                    (f) => f.properties.id !== id
                  );
                  const newMapData = {
                    type: "FeatureCollection",
                    features: filteredFeatures,
                  };
                  setMapData(newMapData);
                })
                .catch((error) => console.error(error));
            });
          });
        },
        style: (feature) => ({
          color: feature.properties.validated ? "green" : "red",
        }),
      });
      if (geoJSONLayer) {
        geoJSONLayer.remove();
      }

      setGeoJSONLayer(geoJSON);
    }
  }, [mapData]);

  const ChangeMapView = ({ geoJSONLayer }) => {
    const map = useMap();
    useEffect(() => {
      if (geoJSONLayer) {
        const bounds = geoJSONLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds);
        }
        geoJSONLayer.addTo(map);
      }
    }, [map, geoJSONLayer]);
    return null;
  };

  return (
    <MapContainer
      center={[51.505, -0.09]}
      minZoom={18}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer maxZoom={22} minZoom={18} url={sourceImagery} />
      <ChangeMapView geoJSONLayer={geoJSONLayer} />
    </MapContainer>
  );
};

export default FeedbackMap;
