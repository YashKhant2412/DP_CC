import React, { useEffect, useRef } from "react";
import "ol/ol.css";
import { Map, View } from "ol";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { OSM, Vector as VectorSource } from "ol/source";
import { Draw, Modify, Snap } from "ol/interaction";
import { MultiLineString } from "ol/geom";
import { Stroke, Style } from "ol/style";
import arc from "arc";
const MapComponent = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });

    var stylelocal = new Style({
      geometry: function (feature) {
        var projection = map.getView().getProjection();
        var coordinates = feature
          .getGeometry()
          .clone()
          .transform(projection, "EPSG:4326")
          .getCoordinates();
        var coords = [];
        for (var i = 0; i < coordinates.length - 1; i++) {
          var from = coordinates[i];
          var to = coordinates[i + 1];
          var arcGenerator = new arc.GreatCircle(
            { x: from[0], y: from[1] },
            { x: to[0], y: to[1] }
          );
          var arcLine = arcGenerator.Arc(100, { offset: 10 });
          arcLine.geometries.forEach(function (geom) {
            coords.push(geom.coords);
          });
        }
        var line = new MultiLineString(coords);
        line.transform("EPSG:4326", projection);
        return line;
      },
      stroke: new Stroke({
        width: 4,
        color: "red",
      }),
    });

    const vectorLayer = new VectorLayer({
      source: new VectorSource(),
      style: stylelocal,
    });

    map.addLayer(vectorLayer);

    const draw = new Draw({
      source: vectorLayer.getSource(),
      type: "LineString",
      maxPoints: 3,
    });

    draw.on("drawstart", (event) => {
      console.log("new line drawing started");
      vectorLayer.getSource().clear();
    });

    draw.on("drawend", (event) => {});

    var modify = new Modify({
      source: vectorLayer.getSource(),
    });

    map.addInteraction(draw);
    map.addInteraction(modify);

    return () => {
      map.removeInteraction(draw);
      map.removeInteraction(modify);
    };
  }, []);

  return <div ref={mapRef} style={{ width: "100%", height: "800px" }}></div>;
};

export default MapComponent;
