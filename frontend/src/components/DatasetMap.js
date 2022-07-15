import React, { useEffect, useMemo, useState } from "react";

import {
  FeatureGroup,
  LayersControl,
  Marker,
  Popup,
  TileLayer,
  MapContainer,
  Rectangle,
  Polygon,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { EditControl } from "react-leaflet-draw";

import "leaflet-draw/dist/leaflet.draw.css";
import { Grid } from "@mui/material";
import { useMutation } from "react-query";
import {GeoJSON} from 'react-leaflet';
import axios from '../axios'
const DatasetMap = (props) => {
  const [mapLayers, setMapLayers] = useState([]);
  const [dummy, setDummy] = useState([]);
  const [geoJsonLoadedFile, setgeoJsonLoadedFile] = useState(props.geoJSON);
  const [geoJsonLoadedLabels, setgeoJsonLoadedLabels] = useState();
  
  const [map, setMap] = useState(null);
  const [zoom, setZoom] = useState(17);
  const [geoJSON, setgeoJSON] = useState();
  const [mapError, setMapError] = useState();
  const [ fromDB, setFromDB] = useState(false);

  // props.oamImagery && console.log("props.oamImagery.url", props.oamImagery.url);

   const getLabels = async (box) => {

    try {       
      
      setgeoJsonLoadedLabels(null)
      console.log(" getLabels for box", box)
    
     const res = await axios.get(`/label/?in_bbox=${box._southWest.lng},${box._southWest.lat},${box._northEast.lng},${box._northEast.lat}`);
      console.log("res from getLabels ", res)
      if (res.error)
        setMapError(res.error);
      else {

        // TODO: Handle the labels data here, to be added to the state and leaflet control
        setgeoJsonLoadedLabels(res.data)

         // remove from state
           setMapLayers((layers) => layers.filter((l) => l.type === "aoi"));

      //      const newLayers = [];
      // Object.values(res.data.features).map((feture) => {
      //      newLayers.push({
      //     id: _leaflet_id,
      //     aoiId: -1,
      //     feature:feature,
      //     type: "lbl",
      //     latlngs: layer.getLatLngs(),
      //     area: L.GeometryUtil.geodesicArea(layer.getLatLngs()),
      //   });
      // });
      //     setMapLayers((layers) => {
      // // console.log('How many', layers.length)
      // return [...layers, ...newLayers];
      //   });
      let leafletGeoJSON = new L.GeoJSON(res.data);
   const newLayers = [];
    leafletGeoJSON.eachLayer((layer) => {
      const { _leaflet_id, feature } = layer;
     console.log("on get labels layer",layer,layer.getLatLngs(),L.GeometryUtil.geodesicArea(layer.getLatLngs()))
       newLayers.push({
          id: _leaflet_id,
          aoiId: -1,
          feature:feature,
          type: "label",
          latlngs: layer.getLatLngs(),
         
        });
      
    });
   
    setMapLayers((layers) => {
      // console.log('How many', layers.length)
      return [...layers, ...newLayers];
    });

        return res.data;
        
      }
    } catch (e) {
      console.log("isError",e);
      setMapError(e)
      
    } finally {
      
    }
  };
  const { mutate:mutategetLabels, data:labelsData } = useMutation(getLabels);

  const editDB = async ({id,poly,type}) => {

    try {       
      
      let data = {        
        dataset: 1,
        geom: poly
      }
      console.log(" edit data ", data)
    
     const res = await axios.patch(`/${type}/${id}/`, data);
      console.log("res from edit ", res)
      if (res.error)
        setMapError(res.error);
      else 
        return res.data;
    } catch (e) {
      console.log("isError",e);
      setMapError(e)
      
    } finally {
      
    }
  };
  const { mutate:mutateEditDB, data:editResult } = useMutation(editDB);

  const deleteDB = async ({id,type}) => {

    try {       
      
     
      console.log(" delete ")
    
     const res = await axios.delete(`/${type}/${id}/`);
      console.log("res from edit ", res)
      if (res.error)
        setMapError(res.error);
      else 
        return res.data;
    } catch (e) {
      console.log("isError",e);
      setMapError(e)
      
    } finally {
      
    }
  };
  const { mutate:mutateDeleteDB, data:deleteResult } = useMutation(deleteDB);


  const createDB = async ({poly,leafletId,type}) => {

      try {   
        let body = {}    
        if (type ==="aoi")
         body = {
          geom: poly,
          dataset: 1
        }
        else
        body = {
          geom: poly
        }
        

       const res = await axios.post(`/${type}/`, body);
  
        if (res.error)
        setMapError(res.error.response.statusText);
        else 
        {

          // add aoi ID to the state after insert
          setMapLayers((layers) =>
          layers.map((l) =>
           {
             if ( l.id === leafletId)
             {
               const newAOI = {
                ...l,
                aoiId:res.data.id,
                feature:res.data,
                
              }                          
              return newAOI
            }
          else
          return l;
           }
          )
        );
      
           return res.data;
        }
         
      } catch (e) {
        console.log("isError",e);
        setMapError(e)
        
      } finally {
        
      }
    };
    const { mutate:mutateCreateDB, data:createResult } = useMutation(createDB);

    const getAOI = async () => {

      try {       
        

       const res = await axios.get("/aoi/?dataset=1");
  
        if (res.error)
        setMapError(res.error.response.statusText);
        else 
        {
          console.log("getAOI",res.data)
          setFromDB(true)
          return res.data;
        }
      } catch (e) {
        console.log("isError",e);
        setMapError(e)
        
      } finally {
        
      }
    };
    const { mutate:mutateGetAOI, data:AOIs } = useMutation(getAOI);

    useEffect(() => {
       mutateGetAOI()
    
      return () => {
       
      }
    }, [])
    
 useEffect(() => {
     if (AOIs)
     {
        setgeoJsonLoadedFile(AOIs);
        setMapLayers([]);
     }
    
      return () => {
       
      }
    }, [AOIs])

  useEffect(() => {
    props.onMapLayersChange(mapLayers);
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
      }
      const polygon = "SRID=4326;POLYGON((" + JSON.stringify(converToGeoPolygon([newAOI ])[0][0].reduce(
                                                                            (p,c,i)=> ( p + c[1] + " " + c[0] + "," ),
                                                                            ""
                                                                            )
                                  ).slice(1,-2) +
                                  "))"                        
                                                                            
      console.log("converToPolygon([layer])",polygon );
      mutateCreateDB({poly:polygon,leafletId:_leaflet_id,type:str})
      setMapLayers((layers) => [
        ...layers,
        newAOI,
      ]);



    }
  };

  const _onEdited = (e) => {
    console.log("_onEdited",e);
    const {
      layers: { _layers },
    } = e;

   
    Object.values(_layers).map(({ _leaflet_id, editing, _latlngs }) => {
      setMapLayers((layers) =>
        layers.map((l) =>
         {
           if ( l.id === _leaflet_id)
           {
             const newAOI = {
              ...l,
              latlngs: editing.latlngs ? editing.latlngs[0][0] : _latlngs[0],
              area: editing.latlngs
                ? L.GeometryUtil.geodesicArea(editing.latlngs[0][0])
                : L.GeometryUtil.geodesicArea(_latlngs[0]),
            }
           
           
            return newAOI
          }
        else
        return l;
         }
        )
      );
    });

    Object.values(_layers).map(({ _leaflet_id, editing, _latlngs ,feature}) => {
      const newAOI = {      
        latlngs: editing.latlngs ? editing.latlngs[0][0] : _latlngs[0],
        area: editing.latlngs
          ? L.GeometryUtil.geodesicArea(editing.latlngs[0][0])
          : L.GeometryUtil.geodesicArea(_latlngs[0]),
      }
      const polygon = "SRID=4326;POLYGON((" + JSON.stringify(converToGeoPolygon([newAOI ])[0][0].reduce(
        (p,c,i)=> ( p + c[1] + " " + c[0] + "," ),
        ""
        )
        ).slice(1,-2) +
        "))";                        
        console.log("polygon onedit",polygon)
        //TODO: check the feature, if not exists rab from the state
        if (feature === undefined )
        {
          console.log("mapLayers",mapLayers)
     
          feature = {
            id: mapLayers.find(e => e.id === _leaflet_id ).aoiId
          }
        }
      console.log("on edit new polygon ",feature.id,polygon);
     
      mutateEditDB({id:feature.id,poly:polygon,type: (feature && feature.properties && feature.properties.aoi ? "label": "aoi" )})

      return null;
    });
  };

  const _onDeleted = (e) => {
    console.log(e);
    const {
      layers: { _layers },
    } = e;

    Object.values(_layers).map(({ _leaflet_id ,feature}) => {
      
      console.log('delete feature',feature);
      mutateDeleteDB({id:feature.id,type: (feature && feature.properties && feature.properties.aoi ? "label": "aoi" )});
    });

    Object.values(_layers).map(({ _leaflet_id }) => {
      setMapLayers((layers) => layers.filter((l) => l.id !== _leaflet_id));
    });
  };

  const converToPolygon = (layer) => {

    const allPoly = [];
    layer.forEach((element) => {
      const x = element.latlngs.map((e) => [e.lat, e.lng]);
      allPoly.push([x]);
    });
    return allPoly;
  };

  const converToGeoPolygon = (layer) => {
    if (layer.length === 0) return []
    const allPoly = converToPolygon(layer);

    // console.log("converToGeoPolygon",allPoly)
    
    const newAll = []
    allPoly.forEach(element => {
      const x = [ ...element[0], element[0][0]]

      newAll.push([x])
    });
    return newAll
    
  };

  const blueOptions = { color: "#ADD8E6" };
  const greenOptions = { color: "green" };
  const multiPolygon = [
    [
      [51.51, -0.12],
      [51.51, -0.13],
      [51.53, -0.13],
      [51.53, -0.12],
    ],
    [
      [51.51, -0.05],
      [51.51, -0.07],
      [51.53, -0.07],
    ],
  ];

  const corrdinatestoLatlngs = (layer) =>
  {
    const latlngs = []
    const coordinates = layer.feature.geometry.coordinates[0];
    for (let index = 0; index < coordinates.length -1; index++) {
      const element = coordinates[index];

      latlngs.push({lat: element[1],lng:element[0]})      
    }
    return latlngs
        
    // layer
    // [
    //   {
    //     "lat": -0.29876588491525485,
    //     "lng": 36.074897276690386
    //   },
    //   {
    //     "lat": -0.29701710827394917,
    //     "lng": 36.074897276690386
    //   },
    //   {
    //     "lat": -0.29701710827394917,
    //     "lng": 36.077172973400586
    //   },
    //   {
    //     "lat": -0.29876588491525485,
    //     "lng": 36.077172973400586
    //   }
    // ]
  }
  const _onFeatureGroupReady = (reactFGref, _geoJsonLoadedFile) => {
    // console.log("_onFeatureGroupReady");
    console.log("_onFeatureGroupReady reactFGref",reactFGref);
    if (reactFGref)
    {
      // make sure each layer has a featre geojson for created ones
      reactFGref.eachLayer(l => {
        // console.log("each layer", l)
        if (l.feature === undefined)
        {
          // console.log("mapLayers", mapLayers)
          l.feature = mapLayers.find(m => m.id === l._leaflet_id).feature
        }
      })
    }
    if (reactFGref === null || _geoJsonLoadedFile === null) {
      return;
    }
    let leafletFG = reactFGref;
    const geoJsonLoadedFile = {..._geoJsonLoadedFile}
    setgeoJsonLoadedFile(null);

    // populate the leaflet FeatureGroup with the geoJson layers

    console.log("importing service area from state",geoJsonLoadedFile);
    let leafletGeoJSON = new L.GeoJSON(geoJsonLoadedFile);
    console.log("leafletGeoJSON", leafletGeoJSON._layers);

    leafletGeoJSON.eachLayer((layer) => {
      const newLayer = { ...layer };

      const { feature } = layer;
      if (feature.properties.dataset) {
        // console.log("_latlngs");
        // console.log("layer added", layer);
        // // const getlatlngs = feature.properties.dataset ? corrdinatestoLatlngs(layer) :layer._latlngs[0][0]
        // // newLayer._latlngs[0] = getlatlngs;       
        // console.log("newLayer", newLayer);
        leafletFG.addLayer(layer);
      }
      if (feature.properties.taskStatus === "VALIDATED" )
      {
       const getlatlngs = layer._latlngs[0][0]
        newLayer._latlngs[0] = getlatlngs;       
        // console.log("newLayer", newLayer);
        leafletFG.addLayer(layer);
      }
    });
    
    const newLayers = [];
    leafletGeoJSON.eachLayer((layer) => {
      const { _leaflet_id, feature } = layer;
      if (feature.properties.taskStatus === "VALIDATED" || feature.properties.dataset)
        {
          const getlatlngs = feature.properties.dataset ? corrdinatestoLatlngs(layer) :layer.getLatLngs()[0]
          console.log("getLatLngs() ", layer);

          newLayers.push({
          id: _leaflet_id,
          aoiId: feature.id,
          feature:feature,
          type: "aoi",
          latlngs: getlatlngs,
          area: L.GeometryUtil.geodesicArea(getlatlngs),
        });}
    });
   
    setMapLayers((layers) => {
      // console.log('How many', layers.length)
      return [...layers, ...newLayers];
    });
   
  };
  const _onFeatureGroupReadyLabels = (reactFGref, _geoJsonLoadedFile) => {
    // console.log("_onFeatureGroupReady");
    console.log("_onFeatureGroupReadyLabels reactFGref",reactFGref);
    // if (reactFGref)
    // {
    //   // make sure each layer has a featre geojson for created ones
    //   reactFGref.eachLayer(l => {
    //     // console.log("each layer", l)
    //     if (l.feature === undefined)
    //     {
    //       // console.log("mapLayers", mapLayers)
    //       l.feature = mapLayers.find(m => m.id === l._leaflet_id).feature
    //     }
    //   })
    // }
    if (reactFGref === null || _geoJsonLoadedFile === null) {
      return;
    }
    let leafletFG = reactFGref;
    const geoJsonLoadedFile = {..._geoJsonLoadedFile}
   
    setgeoJsonLoadedLabels(null)
    // populate the leaflet FeatureGroup with the geoJson layers

    console.log("importing service labels",geoJsonLoadedFile);
    let leafletGeoJSON = new L.GeoJSON(geoJsonLoadedFile);
    console.log("leafletGeoJSON labels", leafletGeoJSON._layers);
    const {_layers} = leafletFG
      
    Object.values(_layers).map((l) => {
    
      if (l.feature && l.feature.properties && l.feature.properties.aoi)
        leafletFG.removeLayer(l)

    });

   

    leafletGeoJSON.eachLayer((layer) => {
  
     const l = Object.values(_layers).find(x=> x.feature.id === layer.feature.id)
    //  console.log("found in leaflet already ", l)
        if (l === undefined)
     {
      leafletFG.addLayer(layer);
     }
      // }
    });
    
    //  const newAOI = {
    //   id: _leaflet_id,
    //   type: str,
    //   latlngs: layer.getLatLngs()[0],
    //   area: L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]),
    // }
    // const polygon = "SRID=4326;POLYGON((" + JSON.stringify(converToGeoPolygon([newAOI ])[0][0].reduce(
    //                                                                       (p,c,i)=> ( p + c[1] + " " + c[0] + "," ),
    //                                                                       ""
    //                                                                       )
    //                             ).slice(1,-2) +
    //                             "))"                        
                                                                          
    // console.log("converToPolygon([layer])",polygon );
   
    // setMapLayers((layers) => [
    //   ...layers,
    //   newAOI,
    // ]);

    
   console.log("all good")
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
      },
      moveend: (e) => {
        const { _animateToZoom,_layers } = e.target;
        console.log("moveend", e, e.target.getBounds());
        console.log("zoom is", _animateToZoom);
        console.log("see the map ", map);
        // upon moving, send request to API to get the elemts here. Ok, I will do it :)
        Object.values(_layers).map((l) => {
    
          if (l.feature && l.feature.properties && l.feature.properties.aoi)
            map.removeLayer(l)
         
        });
    
        
        if (_animateToZoom >= 19)
        mutategetLabels(e.target.getBounds())
        
      },
    });
    return null;
  }
  return (
    <>
      {/* <EditControlExample></EditControlExample> */}
     
      {/* <button onClick={addGeoJSONHandler}>Add TM Project 11974</button>
      <button onClick={changePositionHandler}>Change position</button> */}
      <h1>Selected dataset #1</h1>
      <p>zoom: {zoom} 
      {mapError && <span style={{color: "red"}}> Error: {mapError} </span>}
      </p>
       <select defaultValue="aoi" id="selectedLayer">
        <option value="label">Labels</option>
        <option value="aoi">AOIs</option>
      </select>
      <MapContainer
        className="pointer"
        center={[-0.29815, 36.07572]}
        style={{
          height: "700px",
          width: "100%",
        }}
        zoom={zoom}
        whenCreated={setMap}
      >
        <MyComponent />

        <LayersControl position="topright">
          {/* <LayersControl.BaseLayer name="Google" >
            <TileLayer
              maxZoom={24}
              attribution={"Copyright &copy; Google"}
              url={
                "http://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              }
            />
          </LayersControl.BaseLayer>  */}

          <LayersControl.BaseLayer name="Maxar Preimum">
            <TileLayer
              maxZoom={21}
              attribution='<a href="https://wiki.openstreetmap.org/wiki/DigitalGlobe" target="_blank"><img class="source-image" src="https://osmlab.github.io/editor-layer-index/sources/world/Maxar.png"><span class="attribution-text">Terms &amp; Feedback</span></a>'
              url={
                "https://services.digitalglobe.com/earthservice/tmsaccess/tms/1.0.0/DigitalGlobe:ImageryTileService@EPSG:3857@jpg/{z}/{x}/{-y}.jpg?connectId=" +
                process.env.REACT_APP_CONNECT_ID
              }
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="OSM" checked>
            <TileLayer
              maxZoom={19}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
 <LayersControl.BaseLayer name="Google" >
            <TileLayer
              maxZoom={22}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="http://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            />
          </LayersControl.BaseLayer>
          {props.oamImagery && (
            <LayersControl.BaseLayer name={props.oamImagery.name}>
              <TileLayer
                maxZoom={props.oamImagery.maxzoom}
                minZoom={props.oamImagery.minzoom}
                attribution={props.oamImagery.name}
                url={props.oamImagery.url}
              />
            </LayersControl.BaseLayer>
          )}
        </LayersControl>

        <FeatureGroup>
          <Polygon
            pathOptions={blueOptions}
            positions={converToPolygon(
              mapLayers.filter((e) => e.type === "aoi")
            )}
          />
          {/* <Polygon
            pathOptions={greenOptions}
            positions={converToPolygon(
              mapLayers.filter((e) => e.type === "lbl")
            )}
          /> */}
          {/* {geoJsonLoadedLabels && 
         <GeoJSON attribution="&copy; credits to OSM" data={geoJsonLoadedLabels} />} */}
        </FeatureGroup>
        <FeatureGroup
          ref={(reactFGref) => {
            _onFeatureGroupReady(reactFGref, geoJsonLoadedFile);
            if (zoom >= 19 )
            {
              _onFeatureGroupReadyLabels(reactFGref, geoJsonLoadedLabels);
            }
            else
            {
                setgeoJsonLoadedLabels(null)
            }
          }}
        >
          <EditControl
            position="topleft"
            onCreated={(e) => {
              _onCreate(e, document.getElementById("selectedLayer").value);
            }}
            onEdited={_onEdited}
            onDeleted={_onDeleted}
            draw={{
              polyline: false,
              rectangle: true,
              circle: false,
              circlemarker: false,
              marker: false,
            }}
          />
        </FeatureGroup>
      </MapContainer>
      <pre className="text-left">
        all mapLayers{JSON.stringify(converToGeoPolygon(mapLayers), 0, 2)}
      </pre>
      <pre className="text-left">
       all AOI from  mapLayers{JSON.stringify(
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
      <pre className="text-left">
        {JSON.stringify(
         AOIs,
          0,
          2
        )}
      </pre> 
       </>
  );
};

export default DatasetMap;
