import React, { useContext, useEffect, useMemo, useRef, useState } from "react";

import {
  FeatureGroup,
  LayersControl,
  Marker,
  Popup,
  TileLayer,
  MapContainer,
  GeoJSON,
  Polygon,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";
import { EditControl } from "react-leaflet-draw";

import "leaflet-draw/dist/leaflet.draw.css";

import { useMutation, useQuery } from "react-query";

import intersect from "@turf/intersect";
import { multiPolygon } from "@turf/helpers";

import axios from "../../../../axios";

import {
  approximateGeom,
  converToGeoPolygon,
  converToPolygon,
} from "../../../../utils";
import DatasetEditorHeader from "./DatasetEditorHeader";
import AuthContext from "../../../../Context/AuthContext";
const DatasetMap = (props) => {
  const [mapLayers, setMapLayers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState("aoi");
  const [geoJsonLoadedFile, setgeoJsonLoadedFile] = useState(props.geoJSON);
  const [geoJsonLoadedLabels, setgeoJsonLoadedLabels] = useState();

  const [map, setMap] = useState(null);
  const [zoom, setZoom] = useState(17);

  const [mapError, setMapError] = useState();
  const [fromDB, setFromDB] = useState(false);

  const { accessToken } = useContext(AuthContext);

  const getLabels = async (box) => {
    try {
      setgeoJsonLoadedLabels(null);
      console.log(" getLabels for box", box);

      const headers = {
        "access-token": accessToken,
      };
      const res = await axios.get(
        `/label/?aoi__dataset=${props.dataset.id}&in_bbox=${box._southWest.lng},${box._southWest.lat},${box._northEast.lng},${box._northEast.lat}`,
        { headers }
      );
      console.log("res from getLabels ", res);
      if (res.error) setMapError(res.error);
      else {
        // TODO: Handle the labels data here, to be added to the state and leaflet control
        setgeoJsonLoadedLabels(res.data);

        // remove from state
        setMapLayers((layers) => layers.filter((l) => l.type === "aoi"));

        let leafletGeoJSON = new L.GeoJSON(res.data);
        const newLayers = [];
        leafletGeoJSON.eachLayer((layer) => {
          const { _leaflet_id, feature } = layer;
          //  console.log("on get labels layer",layer,layer.getLatLngs(),L.GeometryUtil.geodesicArea(layer.getLatLngs()))
          newLayers.push({
            id: _leaflet_id,
            aoiId: -1,
            feature: feature,
            type: "label",
            latlngs: layer.getLatLngs()[0],
          });
        });

        setMapLayers((layers) => {
          // console.log('How many', layers.length)
          return [...layers, ...newLayers];
        });

        return res.data;
      }
    } catch (e) {
      console.log("isError", e);
      setMapError(e);
    } finally {
    }
  };
  const { mutate: mutategetLabels, data: labelsData } = useMutation(getLabels);

  const editDB = async ({ id, poly, type }) => {
    try {
      let data = {
        dataset: props.dataset.id,
        geom: poly,
      };
      console.log(" edit data ", data);
      // type is even label or aoi and it goes to cooresponding API end point
      const headers = {
        "access-token": accessToken,
      };
      const res = await axios.patch(`/${type}/${id}/`, data, { headers });
      console.log("res from edit ", res);
      if (res.error) setMapError(res.error);
      else return res.data;
    } catch (e) {
      console.log("isError", e);
      setMapError(e);
    } finally {
    }
  };
  const { mutate: mutateEditDB, data: editResult } = useMutation(editDB);

  const deleteDB = async ({ id, type }) => {
    try {
      console.log(" delete ");

      const headers = {
        "access-token": accessToken,
      };
      const res = await axios.delete(`/${type}/${id}/`, { headers });
      console.log("res from edit ", res);
      if (res.status === 204 || res.error) return;

      return res.data;
    } catch (e) {
      console.log("isError", e);
      setMapError(e);
    } finally {
    }
  };
  const { mutate: mutateDeleteDB, data: deleteResult } = useMutation(deleteDB);

  const createDB = async ({ poly, leafletId, type, polyTemp }) => {
    try {
      let body = {};
      if (type === "aoi")
        body = {
          geom: poly,
          dataset: props.dataset.id,
        };
      else {
        const f1 = multiPolygon([polyTemp]);
        // console.log('intersection f1',f1)
        let aoiId = -1;

        mapLayers
          .filter((e) => e.type === "aoi")
          .forEach((element) => {
            console.log(
              "intersection mapLayers",
              converToGeoPolygon([element])[0],
              mapLayers
            );
            const f2 = multiPolygon(converToGeoPolygon([element])[0]);
            console.log("intersection f2", f2);

            const intersection = intersect(f1.geometry, f2.geometry);
            if (intersection !== null && aoiId === -1) {
              console.log("intersection ", intersection, element);
              aoiId = element.aoiId;
            }
          });
        //polyTemp
        console.log("intersection aoiId", aoiId);
        body = {
          geom: poly,
          aoi: aoiId,
        };
      }

      const headers = {
        "access-token": accessToken,
      };
      const res = await axios.post(`/${type}/`, body, { headers });
      console.log("res ", res);

      if (res.error) setMapError(JSON.stringify(res.error));
      else {
        // add aoi ID to the state after insert
        if (type === "aoi") {
          setMapLayers((layers) =>
            layers.map((l) => {
              if (l.id === leafletId) {
                const newAOI = {
                  ...l,
                  aoiId: res.data.id,
                  feature: res.data,
                };
                return newAOI;
              } else return l;
            })
          );
        }
        if (type === "label") {
          setMapLayers((layers) =>
            layers.map((l) => {
              if (l.id === leafletId) {
                const newAOI = {
                  ...l,
                  aoiId: res.data.id,
                  id: res.data.id,
                  feature: res.data,
                };
                return newAOI;
              } else return l;
            })
          );
        }

        return res.data;
      }
    } catch (e) {
      console.log("isError", e);
      setMapError(e);
    } finally {
    }
  };
  const { mutate: mutateCreateDB, data: createResult } = useMutation(createDB);

  const getAOI = async () => {
    try {
      const res = await axios.get(`/aoi/?dataset=${props.dataset.id}`);

      if (res.error) setMapError(res.error.response.statusText);
      else {
        // console.log("getAOI", res.data);
        setFromDB(true);
        return res.data;
      }
    } catch (e) {
      console.log("isError", e);
      setMapError(e);
    } finally {
    }
  };
  const { data: AOIs, refetch } = useQuery(
    "getAOI" + props.dataset.id,
    getAOI,
    { refetchInterval: 2000 }
  );

  useEffect(() => {
    if (AOIs) {
      setgeoJsonLoadedFile(AOIs);
      setMapLayers([]);
    }

    return () => {};
  }, [AOIs]);

  useEffect(() => {
    document.querySelectorAll(".leaflet-bar a").forEach((e) => {
      e.style.backgroundColor = "rgb(51, 136, 255)";
      console.log("leaflet-bar a", e.style);
    });
    return () => {};
  }, []);

  useEffect(() => {
    props.onMapLayersChange(
      mapLayers.sort((a, b) => (a.aoiId > b.aoiId ? 1 : -1))
    );
    if (props.geoJSON) {
      setgeoJsonLoadedFile(props.geoJSON);
      props.emptyPassedgeoJSON();
    }
    if (
      map &&
      props.currentPosision &&
      props.currentPosision.length > 0 &&
      props.currentPosision[0]
    ) {
      console.log("props.currentPosision", props.currentPosision);
      map.setView(props.currentPosision, props.zoom);
      setZoom(props.zoom);
      props.clearCurrentPosision();
    }
    return () => {};
  }, [mapLayers, props, map, props.geoJSON]);

  const _onCreate = (e, str) => {
    console.log("_onCreate", e);
    const { layerType, layer } = e;

    console.log("mapLayers", mapLayers);

    // Only polygons are supported with Edit and Delete event .. rectangles editand delete have issues.
    if (layerType === "polygon" || layerType === "rectangle") {
      const { _leaflet_id } = layer;

      // call the API and add the AOI to DB
      const newAOI = {
        id: _leaflet_id,
        type: str,
        latlngs: layer.getLatLngs()[0],
        area: L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]),
      };
      const points = JSON.stringify(
        converToGeoPolygon([newAOI])[0][0].reduce(
          (p, c, i) => p + c[1] + " " + c[0] + ",",
          ""
        )
      ).slice(1, -2);
      // console.log("points",points)
      const approximated = str === "aoi" ? approximateGeom(points) : points;
      const polygon = "SRID=4326;POLYGON((" + approximated + "))";

      console.log("converToPolygon([layer])", polygon);
      mutateCreateDB({
        poly: polygon,
        leafletId: _leaflet_id,
        type: str,
        polyTemp: converToGeoPolygon([newAOI])[0][0],
      });
      setMapLayers((layers) => [...layers, newAOI]);
      refetch();
    }
  };

  const _onEdited = (e) => {
    console.log("_onEdited", e);
    const {
      layers: { _layers },
    } = e;

    Object.values(_layers).map(({ _leaflet_id, editing, _latlngs }) => {
      setMapLayers((layers) =>
        layers.map((l) => {
          if (l.id === _leaflet_id) {
            const newAOI = {
              ...l,
              latlngs: editing.latlngs ? editing.latlngs[0][0] : _latlngs[0],
              area: editing.latlngs
                ? L.GeometryUtil.geodesicArea(editing.latlngs[0][0])
                : L.GeometryUtil.geodesicArea(_latlngs[0]),
            };

            return newAOI;
          } else return l;
        })
      );
    });

    Object.values(_layers).map(
      ({ _leaflet_id, editing, _latlngs, feature }) => {
        const newAOI = {
          latlngs: editing.latlngs ? editing.latlngs[0][0] : _latlngs[0],
          area: editing.latlngs
            ? L.GeometryUtil.geodesicArea(editing.latlngs[0][0])
            : L.GeometryUtil.geodesicArea(_latlngs[0]),
        };
        const polygon =
          "SRID=4326;POLYGON((" +
          JSON.stringify(
            converToGeoPolygon([newAOI])[0][0].reduce(
              (p, c, i) => p + c[1] + " " + c[0] + ",",
              ""
            )
          ).slice(1, -2) +
          "))";
        console.log("polygon onedit", polygon);
        //TODO: check the feature, if not exists rab from the state
        if (feature === undefined) {
          console.log("mapLayers", mapLayers);

          feature = {
            id: mapLayers.find((e) => e.id === _leaflet_id).aoiId,
          };
        }
        console.log("on edit new polygon ", feature.id, polygon);

        mutateEditDB({
          id: feature.id,
          poly: polygon,
          type:
            feature && feature.properties && feature.properties.aoi
              ? "label"
              : "aoi",
        });

        return null;
      }
    );
  };

  const _onDeleted = (e) => {
    console.log("_onDeleted", e);
    const {
      layers: { _layers },
    } = e;

    Object.values(_layers).map(({ _leaflet_id, feature }) => {
      console.log("delete feature", feature);
      if (feature.id)
        mutateDeleteDB({
          id: feature.id,
          type:
            feature && feature.properties && feature.properties.aoi
              ? "label"
              : "aoi",
        });
    });

    Object.values(_layers).map(({ _leaflet_id }) => {
      setMapLayers((layers) => layers.filter((l) => l.id !== _leaflet_id));
    });
  };
  const _onEditStart = (e) => {
    setIsEditing(true);
  };
  const _onEditStop = (e) => {
    setIsEditing(false);
  };

  const blueOptions = { color: "#03002e", width: 10, opacity: 0 };

  const corrdinatestoLatlngs = (layer) => {
    const latlngs = [];
    const coordinates = layer.feature.geometry.coordinates[0];
    for (let index = 0; index < coordinates.length - 1; index++) {
      const element = coordinates[index];

      latlngs.push({ lat: element[1], lng: element[0] });
    }
    return latlngs;
  };
  const _onFeatureGroupReady = (reactFGref, _geoJsonLoadedFile) => {
    if (reactFGref) {
      // make sure each layer has a featre geojson for created ones
      reactFGref.eachLayer((l) => {
        // console.log("each layer", l);
        if (l.feature === undefined) {
          // console.log("mapLayers", mapLayers)
          if (mapLayers.find((m) => m.id === l._leaflet_id))
            l.feature = mapLayers.find((m) => m.id === l._leaflet_id).feature;
        }
      });
    }
    if (reactFGref && fromDB && !isEditing) {
      setFromDB(false);
    }
    if (reactFGref === null || _geoJsonLoadedFile === null || isEditing) {
      return;
    }
    let leafletFG = reactFGref;
    const geoJsonLoadedFile = { ..._geoJsonLoadedFile };
    setgeoJsonLoadedFile(null);

    // populate the leaflet FeatureGroup with the geoJson layers

    console.log("importing service area from state", geoJsonLoadedFile);
    let leafletGeoJSON = new L.GeoJSON(geoJsonLoadedFile);
    console.log("leafletGeoJSON", leafletGeoJSON._layers);

    leafletGeoJSON.eachLayer((layer) => {
      const newLayer = { ...layer };

      const { feature } = layer;
      if (feature.properties.dataset) {
        // Add if not exist by feature ID
        const { _layers } = leafletFG;
        Object.values(_layers).map((l) => {
          if (l.feature && l.feature.id === layer.feature.id)
            leafletFG.removeLayer(l);
        });
        leafletFG.addLayer(layer);
      }
      if (feature.properties.taskStatus === "VALIDATED") {
        const getlatlngs = layer._latlngs[0][0];
        newLayer._latlngs[0] = getlatlngs;
        // console.log("newLayer", newLayer);
        leafletFG.addLayer(layer);
      }
    });

    const newLayers = [];
    leafletGeoJSON.eachLayer((layer) => {
      const { _leaflet_id, feature } = layer;
      if (
        feature.properties.taskStatus === "VALIDATED" ||
        feature.properties.dataset
      ) {
        const getlatlngs = feature.properties.dataset
          ? corrdinatestoLatlngs(layer)
          : layer.getLatLngs()[0];
        console.log("getLatLngs() ", layer);

        newLayers.push({
          id: _leaflet_id,
          aoiId: feature.id,
          feature: feature,
          type: "aoi",
          latlngs: getlatlngs,
          area: L.GeometryUtil.geodesicArea(getlatlngs),
        });
      }
    });

    setMapLayers((layers) => {
      // console.log('How many', layers.length)
      return [...layers, ...newLayers];
    });
  };
  const _onFeatureGroupReadyLabels = (reactFGref, _geoJsonLoadedFile) => {
    if (reactFGref === null || _geoJsonLoadedFile === null) {
      return;
    }
    let leafletFG = reactFGref;
    const geoJsonLoadedFile = { ..._geoJsonLoadedFile };

    setgeoJsonLoadedLabels(null);
    // populate the leaflet FeatureGroup with the geoJson layers

    // console.log("importing service labels",geoJsonLoadedFile);
    let leafletGeoJSON = new L.GeoJSON(geoJsonLoadedFile);
    // console.log("leafletGeoJSON labels", leafletGeoJSON._layers);
    const { _layers } = leafletFG;

    Object.values(_layers).map((l) => {
      if (l.feature && l.feature.properties && l.feature.properties.aoi)
        leafletFG.removeLayer(l);
    });

    leafletGeoJSON.eachLayer((layer) => {
      const l = Object.values(_layers).find(
        (x) => x.feature && x.feature.id === layer.feature.id
      );
      //  console.log("found in leaflet already ", l)
      if (l === undefined) {
        layer.setStyle({
          fillColor: "#D73434",
          weight: 2,
          fillOpacity: "30%",
          color: "#D73434",
        });
        leafletFG.addLayer(layer);
      }
      // }
    });

    console.log("all good");
  };

  const addGeoJSONHandler = (e) => {
    // setgeoJsonLoadedFile(getGeoJson());
  };
  const changePositionHandler = (e) => {
    console.log(map);
    if (map) {
      map.setView([35.82226945695996, 140.50830885451762], 17);
    }
  };
  function MyComponent() {
    const map = useMapEvents({
      zoomend: (e) => {
        const { _animateToZoom } = e.target;
        console.log("zoomend", e, _animateToZoom);
        setZoom(_animateToZoom);
        props.setZoom(_animateToZoom);
      },
      moveend: (e) => {
        const { _animateToZoom, _layers } = e.target;
        console.log("moveend", e, e.target.getBounds());
        console.log("zoom is", _animateToZoom);
        console.log("see the map ", map);
        const collection = document.getElementsByClassName(
          "leaflet-marker-icon leaflet-div-icon leaflet-editing-icon leaflet-touch-icon leaflet-zoom-animated leaflet-interactive leaflet-marker-draggable"
        );
        console.log("Edit mode ", collection.length);
        if (collection.length > 0) return;
        console.log("reload");
        // upon moving, send request to API to get the elemts here. Ok, I will do it :)

        if (_animateToZoom >= 19) {
          Object.values(_layers).map((l) => {
            if (l.feature && l.feature.properties && l.feature.properties.aoi)
              map.removeLayer(l);
          });
          mutategetLabels(e.target.getBounds());
        } else {
          Object.values(_layers).map((l) => {
            if (l.feature && l.feature.properties && l.feature.properties.aoi)
              map.removeLayer(l);
          });
        }
      },
    });
    return null;
  }

  // console.log("props.oamImagery", props.oamImagery);
  return (
    <>
      {mapError && <span style={{ color: "red" }}> Error: {mapError} </span>}

      <MapContainer
        className="pointer"
        center={[-0.29815, 36.07572]}
        style={{
          height: "800px",
          width: "100%",
        }}
        zoom={zoom}
        zoomDelta={0.25}
        wheelPxPerZoomLevel={Math.round(36 / 0.5)}
        zoomSnap={0}
        scrollWheelZoom={true}
        // inertia={true}
        whenCreated={setMap}
      >
        <MyComponent />

        <LayersControl position="topright">
          <LayersControl.BaseLayer name="Maxar Preimum">
            <TileLayer
              maxNativeZoom={21}
              maxZoom={24}
              attribution='<a href="https://wiki.openstreetmap.org/wiki/DigitalGlobe" target="_blank"><img class="source-image" src="https://osmlab.github.io/editor-layer-index/sources/world/Maxar.png"><span class="attribution-text">Terms &amp; Feedback</span></a>'
              url={
                "https://services.digitalglobe.com/earthservice/tmsaccess/tms/1.0.0/DigitalGlobe:ImageryTileService@EPSG:3857@jpg/{z}/{x}/{-y}.jpg?connectId=" +
                process.env.REACT_APP_MAXAR_CONNECT_ID
              }
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="ESRI World Imagery">
            <TileLayer
              maxNativeZoom={18}
              maxZoom={24}
              attribution="ESRI World Imagery"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="OSM" checked={true}>
            <TileLayer
              maxZoom={24}
              maxNativeZoom={22}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Google">
            <TileLayer
              maxNativeZoom={22}
              maxZoom={26}
              attribution='&copy; <a href="https://www.google.com">Google</a>'
              url="http://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            />
          </LayersControl.BaseLayer>
          {props.oamImagery && (
            <LayersControl.BaseLayer name={props.oamImagery.name} checked>
              <TileLayer
                maxZoom={props.oamImagery.maxzoom}
                minZoom={props.oamImagery.minzoom}
                attribution={props.oamImagery.name}
                url={props.oamImagery.url}
                maxNativeZoom={
                  props.oamImagery.url.includes("opena")
                    ? props.oamImagery.maxzoom
                    : 18
                }
              />
            </LayersControl.BaseLayer>
          )}
        </LayersControl>

        {/* <FeatureGroup>
          <Polygon
            pathOptions={blueOptions}
            positions={converToPolygon(
              mapLayers.filter((e) => e.type === "aoi")
            )}
          />
        </FeatureGroup> */}

        <GeoJSON
          key={Math.random()}
          data={AOIs}
          style={{
            color: "rgb(51, 136, 255)",
            weight: 4,
          }}
          // onEachFeature={onEachFeatureOriginalAOIs}
        />
        <FeatureGroup
          ref={(reactFGref) => {
            _onFeatureGroupReady(reactFGref, geoJsonLoadedFile);
            if (zoom >= 19) {
              _onFeatureGroupReadyLabels(reactFGref, geoJsonLoadedLabels);
            } else {
              setgeoJsonLoadedLabels(null);
            }
          }}
        >
          <EditControl
            position="topleft"
            onCreated={(e) => {
              // console.log(
              //   "selectedLayer",
              //   document.querySelector('input[name="selectedLayer"]:checked')
              //     .value
              // );
              _onCreate(e, "aoi");
            }}
            // onEdited={_onEdited}
            // onDeleted={_onDeleted}
            // onEditStart={_onEditStart}
            // onEditStop={_onEditStop}
            // onDrawStart={_onEditStart}
            // onDrawStop={_onEditStop}
            draw={{
              polyline: false,
              polygon: false,
              rectangle: true,
              circle: false,
              circlemarker: false,
              marker: false,
            }}
          />
        </FeatureGroup>
      </MapContainer>

      {props.logs && (
        <>
          {" "}
          <pre className="text-left">
            all mapLayers{JSON.stringify(converToGeoPolygon(mapLayers), 0, 2)}
          </pre>
          <pre className="text-left">
            all AOI from mapLayers
            {JSON.stringify(
              mapLayers.filter((e) => e.type === "aoi"),
              0,
              2
            )}
          </pre>
          <p>all lbls from mapLayers</p>
          <pre className="text-left">
            {JSON.stringify(
              mapLayers.filter((e) => e.type === "label"),
              0,
              2
            )}
          </pre>
          <p>below for AOIs object </p>
          <pre className="text-left">{JSON.stringify(AOIs, 0, 2)}</pre>{" "}
        </>
      )}
    </>
  );
};

export default DatasetMap;
