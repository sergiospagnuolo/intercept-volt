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
    minZoom: 2,
    maxZoom: 13,
    maxBounds: L.latLngBounds(L.latLng(-25.037,-46.120), L.latLng(-18.905, -38.903)),
    maxBoundsViscosity: 1.0
}).setView([-22.794, -43.251], 9);

let geoData;
let markers = [];
let makerLayers = {};
let myRenderer = L.canvas({ padding: 0.5 });

let markerStyles = {
    "faccao": {
        radius: 2.5,
        fillColor: "#8280FF",
        color: "#000",
        stroke: false,
        weight: 1,
        opacity: 0.6,
        fillOpacity: 0.15
    },
    "milicia": {
        radius: 2.5,
        fillColor: "#11CE5C",
        color: "#000",
        stroke: false,
        weight: 1,
        opacity: 0.6,
        fillOpacity: 0.15
    }
}

const topoLayer = new L.TopoJSON();

fetch("data/municipios.topojson").then(response => {
  return response.json();
}).then(response => {
    topoLayer.addData(response);
    topoLayer.setStyle({
        "fillColor": "#f4f4f4",
        "fillOpacity": 1,
        "color": "#000",
        "weight": 1,
        "opacity": 1
    });
    topoLayer.addTo(map);
}).then(response => {
    fetch("data/ocorrencias.geojson").then(response => {
      return response.json();
    }).then(response => {
        geoData = response;
        makerLayers["milicia"] = L.geoJson(geoData, {
            pointToLayer: function (feature, latlng) {
                var i = feature.properties.id;
                if (feature.properties.organizaca == 'milicia' ){
                    markers[i] = L.circleMarker(latlng, markerStyles[feature.properties.organizaca]);
                    return markers[i];
                }
            }
        });
        makerLayers["faccao"] = L.geoJson(geoData, {
            pointToLayer: function (feature, latlng) {
                var i = feature.properties.id;
                if (feature.properties.organizaca == 'faccao' ){
                    markers[i] = L.circleMarker(latlng, markerStyles[feature.properties.organizaca]);
                    return markers[i];
                }
            }
        });
        makerLayers["milicia"].addTo(map);
        makerLayers["faccao"].addTo(map);
    });
});

document.querySelectorAll("#info-map-legend li a").forEach((element, index) => {
    element.addEventListener("click",function(e) {
        let className = e.target.parentElement.className;

        if (map.hasLayer(makerLayers[className])) {
            map.removeLayer(makerLayers[className]);
            e.target.classList.add("off");
        } else {
            map.addLayer(makerLayers[className]);
            e.target.classList.remove("off");
        }
    })
});
