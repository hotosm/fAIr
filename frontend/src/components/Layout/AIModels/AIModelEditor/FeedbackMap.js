import React, { useEffect, useContext, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "../../../../axios";
import AuthContext from "../../../../Context/AuthContext";

const FeedbackMap = ({ feedbackData, sourceImagery }) => {
  const { accessToken } = useContext(AuthContext);
  const [mapFeedbackData, setMapFeedbackData] = useState(null);
  console.log(feedbackData);
  useEffect(() => {
    // Update mapFeedbackData state variable
    setMapFeedbackData(feedbackData);
  }, [feedbackData]);

  const onEachFeature = (feature, layer) => {
    const date = new Date(feature.properties.created_at);
    const formattedDate = date.toLocaleString();
    let validated = feature.properties.validated || false;
    let color = validated ? "green" : "red";
    let validateButtonText = validated ? "Invalidate" : "Validate";
    const validateButton = `<button id="validate-${feature.properties.id}" class="feedback-button">${validateButtonText}</button>`;
    const deleteButton = `<button id="discard-${feature.properties.id}" class="feedback-button">Discard</button>`;
    const buttonsContainer = `<div style="display: flex">${validateButton} ${deleteButton}</div>`;
    const content = `<strong>${feature.properties.feedback_type}</strong><br>${formattedDate}<br>${buttonsContainer}`;
    layer.bindPopup(content);
    layer.setStyle({
      color: color,
    });

    layer.on("popupopen", () => {
      const validateButtonElement = document.getElementById(
        `validate-${feature.properties.id}`
      );
      validateButtonElement.innerHTML = validateButtonText;
      validateButtonElement.addEventListener("click", () => {
        const id = feature.properties.id;
        validated = !validated;
        color = validated ? "green" : "red";
        validateButtonText = validated ? "Invalidate" : "Validate";
        axios
          .patch(
            `/feedback/${id}/`,
            { validated: validated },
            { headers: { "access-token": accessToken } }
          )
          .then(() => {
            feature.properties.validated = validated;
            layer.setStyle({
              color: color,
            });
            validateButtonElement.innerHTML = validateButtonText;
          })
          .catch((error) => {
            console.error(error);
          });
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
            console.log("deleted");
            const filteredFeatures = mapFeedbackData.features.filter(
              (f) => f.properties.id !== id
            );
            console.log(filteredFeatures.length);
            setMapFeedbackData({
              ...mapFeedbackData,
              features: filteredFeatures,
            });
          })
          .catch((error) => {
            console.error(error);
          });
      });
    });
  };

  const getFeatureStyle = (feature) => {
    const validated = feature.properties.validated || false;
    return {
      color: validated ? "green" : "red",
    };
  };

  const ChangeMapView = () => {
    const map = useMap();

    console.log("mapFeedbackData:", mapFeedbackData.length);

    useEffect(() => {
      if (mapFeedbackData && mapFeedbackData.features.length > 0) {
        const geoJSONLayer = new L.GeoJSON(mapFeedbackData, {
          onEachFeature: onEachFeature,
          style: getFeatureStyle,
        });
        const bounds = geoJSONLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds);
        }
        geoJSONLayer.addTo(map);
      }
    }, [map, mapFeedbackData]);

    return null;
  };

  return (
    <MapContainer
      center={[51.505, -0.09]}
      minZoom={18}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer maxZoom={22} minZoom={18} url={sourceImagery} />
      <ChangeMapView />
    </MapContainer>
  );
};

export default FeedbackMap;
