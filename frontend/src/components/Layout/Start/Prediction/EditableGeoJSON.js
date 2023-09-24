import React, { useContext, useEffect, useState } from "react";
import L from "leaflet";

import { GeoJSON } from "react-leaflet";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { useMutation } from "react-query";
// import L from "leaflet";
import AuthContext from "../../../../Context/AuthContext";
import axios from "../../../../axios";
import { converToGeoPolygon } from "../../../../utils";
function deg2tile(lat_deg, lon_deg, zoom) {
  const lat_rad = (Math.PI / 180) * lat_deg;
  const n = Math.pow(2, zoom);
  const xtile = Math.floor(((lon_deg + 180) / 360) * n);
  const ytile = Math.floor(
    ((1 - Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math.PI) / 2) *
      n
  );
  return [xtile, ytile];
}

function num2deg(xtile, ytile, zoom) {
  const n = Math.pow(2, zoom);
  const lon_deg = (xtile / n) * 360.0 - 180.0;
  const lat_rad = Math.atan(Math.sinh(Math.PI * (1 - (2 * ytile) / n)));
  const lat_deg = (lat_rad * 180.0) / Math.PI;
  return [lat_deg, lon_deg];
}

function tile2boundingbox(xtile, ytile, zoom) {
  const [lat_deg, lon_deg] = num2deg(xtile, ytile, zoom);
  const cornerNW = L.latLng(lat_deg, lon_deg);

  const [lat_deg1, lon_deg1] = num2deg(xtile + 1, ytile + 1, zoom);
  const cornerSE = L.latLng(lat_deg1, lon_deg1);

  return L.latLngBounds(cornerNW, cornerSE);
}

// function addTileBoundaryLayer(
//   mapref,
//   addedTiles,
//   tileX,
//   tileY,
//   zoom,
//   setAddedTiles,
//   tileBoundaryLayer
// ) {
//   const key = `${tileX}_${tileY}_${zoom}`;

//   if (!addedTiles.has(key)) {
//     console.log("Key doesn't present in map");
//     const bounds = tile2boundingbox(tileX, tileY, zoom);
//     tileBoundaryLayer = L.rectangle(bounds, {
//       color: "yellow",
//       fill: false,
//       pmIgnore: true,
//     });
//     tileBoundaryLayer.name = "Tile Box";
//     mapref.addLayer(tileBoundaryLayer);
//     mapref.fitBounds(tileBoundaryLayer.getBounds());
//     addedTiles.add(key);
//     setAddedTiles(addedTiles);
//   }
// }

function getFeatureStyle(feature) {
  let color = "red";
  if (feature.properties.action !== "INITIAL") {
    color = "green";
  }

  return {
    color: color,
    weight: 1.5,
  };
}

const EditableGeoJSON = ({
  data,
  setPredictions,
  mapref,
  predictionZoomlevel,
  addedTiles,
  setAddedTiles,
  setCreatedCount,
  setModifiedCount,
  setDeletedCount,
  tileBoundaryLayer,
  modelId,
  trainingId,
  sourceImagery,
  refestchFeeedback,
}) => {
  const onPMCreate = (event) => {
    console.log("Created");
    const createdLayer = event.layer;
    setCreatedCount((prevCount) => prevCount + 1);
    const newFeature = createdLayer.toGeoJSON();
    newFeature.properties = {
      ...newFeature.properties,
      action: "CREATE",
      id: Math.random().toString(36).substring(2, 10),
    };
    console.log(newFeature);
    setPredictions((prevData) => ({
      ...prevData,
      features: [...prevData.features, newFeature],
    }));
    const bounds = event.layer.getBounds();
    const corners = [bounds.getSouthWest(), bounds.getNorthEast()];

    for (const corner of corners) {
      const [tileX, tileY] = deg2tile(
        corner.lat,
        corner.lng,
        predictionZoomlevel
      );
      // addTileBoundaryLayer(
      //   mapref,
      //   addedTiles,
      //   tileX,
      //   tileY,
      //   predictionZoomlevel,
      //   setAddedTiles
      // );
    }
    mapref.removeLayer(createdLayer);
  };
  const { accessToken } = useContext(AuthContext);

  const submitFeedback = async (layer) => {
    try {
      // console.log("layer", layer);
      const newAOI = {
        id: Math.random(),
        latlngs: layer.getLatLngs()[0],
      };
      const points = JSON.stringify(
        converToGeoPolygon([newAOI])[0][0].reduce(
          (p, c, i) => p + c[1] + " " + c[0] + ",",
          ""
        )
      ).slice(1, -2);

      const polygon = "SRID=4326;POLYGON((" + points + "))";

      let body = {
        geom: polygon,
        zoom_level: predictionZoomlevel,
        feedback_type: "TN",
        source_imagery: sourceImagery,
        training: trainingId,
        comments: "comments is not support yet",
      };

      const headers = {
        "access-token": accessToken,
      };
      const res = await axios.post(`/feedback/`, body, { headers });
      console.log("res ", res);
      refestchFeeedback();
    } catch (error) {
      console.log("Error in submitting feedback", error);
    } finally {
    }
  };
  const { mutate: mutateSubmitFeedback } = useMutation(submitFeedback);

  const onEachFeature = (feature, layer) => {
    // layer.on({
    //   "pm:update": (event) => {
    //     const bounds = event.layer.getBounds();
    //     const corners = [bounds.getSouthWest(), bounds.getNorthEast()];

    //     for (const corner of corners) {
    //       const [tileX, tileY] = deg2tile(
    //         corner.lat,
    //         corner.lng,
    //         predictionZoomlevel
    //       );
    //       // addTileBoundaryLayer(
    //       //   mapref,
    //       //   addedTiles,
    //       //   tileX,
    //       //   tileY,
    //       //   predictionZoomlevel,
    //       //   setAddedTiles
    //       // );
    //     }

    //     const editedLayer = event.target;
    //     const editedData = editedLayer.toGeoJSON();
    //     const editedFeatureIndex = data.features.findIndex(
    //       (feature) => feature.id === editedData.id
    //     );
    //     const newData = { ...data };
    //     newData.features[editedFeatureIndex] = editedData;
    //     setPredictions(newData);
    //     if (feature.properties.action !== "MODIFY") {
    //       feature.properties.action = "MODIFY";
    //       setModifiedCount((prevCount) => prevCount + 1);
    //     }
    //   },
    //   "pm:remove": (event) => {
    //     const bounds = event.layer.getBounds();
    //     const corners = [bounds.getSouthWest(), bounds.getNorthEast()];

    //     for (const corner of corners) {
    //       const [tileX, tileY] = deg2tile(
    //         corner.lat,
    //         corner.lng,
    //         predictionZoomlevel
    //       );
    //       // addTileBoundaryLayer(
    //       //   mapref,
    //       //   addedTiles,
    //       //   tileX,
    //       //   tileY,
    //       //   predictionZoomlevel,
    //       //   setAddedTiles
    //       // );
    //     }
    //     const deletedLayer = event.layer;
    //     const newFeatures = data.features.filter(
    //       (feature) =>
    //         feature.properties.id !== deletedLayer.feature.properties.id
    //     );
    //     setPredictions({ ...data, features: newFeatures });
    //     setDeletedCount((prevCount) => prevCount + 1);
    //   },
    // });
    layer.on("click", (e) => {
      console.log(e);
      if (feature.properties.action === "INITIAL") {
        const popupContent = `
      <div>
      <p>
      This feedback will be presented on the model (id: ${modelId}, training id: ${trainingId}) for improvements
      </p>
      <span>Comments:<span/><input type="text" id="comments" name="comments" />
      <br>
        <button id="rightButton" class="feedback-button" type="submit">&#128077; Submit</button>
      </div>
      `;
        const popup = L.popup()
          .setLatLng(e.latlng)
          .setContent(popupContent)
          .openOn(e.target._map);
        const popupElement = popup.getElement();
        popupElement
          .querySelector("#rightButton")
          .addEventListener("click", () => {
            feature.properties.action = "ACCEPT";
            console.log("popup layer ", layer);
            // handle submitting feedback
            mutateSubmitFeedback(layer);
            popup.close();
          });
      }
    });
  };

  useEffect(() => {
    const map = mapref;

    map.pm.addControls({
      position: "topleft",
      drawMarker: false,
      drawPolygon: true,
      drawCircleMarker: false,
      drawCircle: false,
      drawPolyline: false,
      drawText: false,
      editMode: true,
      dragMode: true,
      cutPolygon: false,
      tooltips: true,
      removalMode: true,
      oneBlock: true,
      allowSelfIntersection: false,
    });
    map.on("pm:create", onPMCreate);
  }, [mapref]);

  return (
    <GeoJSON
      key={JSON.stringify(data)}
      data={data}
      pmIgnore={false}
      style={getFeatureStyle}
      onEachFeature={onEachFeature}
    />
  );
};

export default EditableGeoJSON;
