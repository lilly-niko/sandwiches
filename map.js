
var Map                 = ol.Map;        //~ import Map from 'ol/Map.js';
var View                = ol.View;       //~ import View from 'ol/View.js';
var TileLayer           = ol.layer.Tile; //~ import TileLayer from 'ol/layer/Tile.js';
var OSM                 = ol.source.OSM; //~ import OSM from 'ol/source/OSM.js';        



var Feature = ol.Feature;
var Geolocation = ol.Geolocation;
var Point = ol.geom.Point;
var CircleStyle = ol.style.Circle;
var Fill = ol.style.Fill, Stroke = ol.style.Stroke, Style = ol.style.Style;
var VectorSource = ol.source.Vector;
var VectorLayer = ol.layer.Vector;


const view = new View({
  center: [0, 0],
  zoom: 10,
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  target: 'map',
  view: view,
});

const geolocation = new Geolocation({
  // enableHighAccuracy must be set to true to have the heading value.
  trackingOptions: {
    enableHighAccuracy: true,
  },
  projection: view.getProjection(),
});
geolocation.setTracking(true);

const accuracyFeature = new Feature();
geolocation.on('change:accuracyGeometry', function () {
  accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
});

const positionFeature = new Feature();
positionFeature.setStyle(
  new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({
        color: '#3399CC',
      }),
      stroke: new Stroke({
        color: '#fff',
        width: 2,
      }),
    }),
  }),
);

geolocation.on('change:position', function () {
  const coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
  view.centerOn(geolocation.getPosition(),map.getSize(),[parseInt(screen.width/2),parseInt(screen.height/2)])
});

new VectorLayer({
  map: map,
  source: new VectorSource({
    features: [accuracyFeature, positionFeature],
  }),
});

/* ...
const center = ol.proj.transform([24.6067, 43.4170], 'EPSG:4326', 'EPSG:3857');
const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  target: 'map',
  view: new View({
    center: center,
    zoom: 10
  }),
});*/