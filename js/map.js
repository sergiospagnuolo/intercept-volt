L.TopoJSON = L.GeoJSON.extend({
  addData: function(jsonData) {
    if (jsonData.type === 'Topology') {
      for (key in jsonData.objects) {
        geojson = topojson.feature(jsonData, jsonData.objects[key]);
        L.GeoJSON.prototype.addData.call(this, geojson);
      }
    }
    else {
      L.GeoJSON.prototype.addData.call(this, jsonData);
    }
  }
});

let map = L.map('info-map', {
    preferCanvas: true,
    minZoom: 9,
    maxZoom: 13
}).setView([-21.95, -42.91], 9);

let geoData;
let markers = [];
let marker_layer;
let myRenderer = L.canvas({ padding: 0.5 });

let markerStyles = {
    "faccao": {
        radius: 3,
        fillColor: "#ae31d7",
        color: "#000",
        stroke: false,
        weight: 1,
        opacity: 0.5,
        fillOpacity: 0.5
    },
    "milicia": {
        radius: 3,
        fillColor: "#34d7ac",
        color: "#000",
        stroke: false,
        weight: 1,
        opacity: 0.5,
        fillOpacity: 0.5
    }
}

const topoLayer = new L.TopoJSON();

fetch("data/municipios.topojson").then(response => {
  return response.json();
}).then(response => {
    topoLayer.addData(response);
    topoLayer.setStyle({
        "fillColor": "#fff",
        "fillOpacity": 1,
        "color": "#ccc",
        "weight": 1,
        "opacity": 1
    });
    topoLayer.addTo(map);
}).then(response => {
    fetch("data/ocorrencias_id_2016_2017.geojson").then(response => {
      return response.json();
    }).then(response => {
        geoData = response;
        marker_layer = L.geoJson(geoData, {
            pointToLayer: function (feature, latlng) {
                var i = feature.properties.id;
                markers[i] = L.circleMarker(latlng, markerStyles[feature.properties.organizaca]);
                return markers[i];
            }
        });
        marker_layer.addTo(map);
    });
});



function filterByDateRange(greater_than_date, less_than_date) {

    if (map.hasLayer(marker_layer)) {
        map.removeLayer(marker_layer);
    }

    marker_layer = new L.featureGroup();

    geoData.features.forEach((feature, index) => {
        let featureDate = new Date(feature.properties.data);
        if (featureDate <= less_than_date && featureDate >= greater_than_date) {
            marker_layer.addLayer(markers[feature.properties.id]);
        }
    });
    marker_layer.addTo(map);
}
