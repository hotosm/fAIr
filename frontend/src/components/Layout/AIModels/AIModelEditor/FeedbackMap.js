import React, { useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const FeedbackMap = ({ feedbackData, sourceImagery }) => {
  const onEachFeature = (feature, layer) => {
    const date = new Date(feature.properties.created_at);
    const formattedDate = date.toLocaleString();
    const validateButton = `<button class="feedback-button">Validate</button>`;
    const deleteButton = `<button class="feedback-button">Discard</button>`;
    const content = `<strong>${feature.properties.feedback_type}</strong><br>${formattedDate}<br>${validateButton} ${deleteButton}`;
    layer.bindPopup(content);
  };

  const ChangeMapView = () => {
    const map = useMap();

    useEffect(() => {
      if (feedbackData && feedbackData.features.length > 0) {
        const geoJSONLayer = new L.GeoJSON(feedbackData);
        const bounds = geoJSONLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds);
        }
      }
    }, [feedbackData, map]);

    return null;
  };

  const geoJSONStyle = {
    color: "red",
  };

  return (
    <MapContainer
      center={[51.505, -0.09]}
      minZoom={18}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer maxZoom={22} minZoom={18} url={sourceImagery} />
      <GeoJSON
        data={feedbackData}
        onEachFeature={onEachFeature}
        style={geoJSONStyle}
      />
      <ChangeMapView />
    </MapContainer>
  );
};

export default FeedbackMap;
