let map = L.map('info-map', {
    preferCanvas: true,
    minZoom: 9,
    maxZoom: 13
}).setView([-22.25, -42.81], 9);

var geoData;
var markers = [];
var marker_layer;
var myRenderer = L.canvas({ padding: 0.5 });

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

fetch("data/municipios_rj.geojson").then(response => {
  return response.json();
}).then(response => {
    L.geoJSON(response, {
        style: {
            "fillColor": "#fff",
            "fillOpacity": 1,
            "color": "#ccc",
            "weight": 1,
            "opacity": 1
        }
    }).addTo(map);
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
