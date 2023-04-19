import React, { useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const FeedbackMap = ({ feedbackData }) => {
  console.log(feedbackData);
  const onEachFeature = (feature, layer) => {
    layer.bindPopup(feature.properties.id);
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
      zoom={16}
      minZoom={16}
      maxZoom={22}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
