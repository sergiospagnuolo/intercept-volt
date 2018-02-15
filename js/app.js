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
    maxZoom: 13,
    maxBounds: L.latLngBounds(L.latLng(-25.037,-46.120), L.latLng(-18.905, -38.903)),
    maxBoundsViscosity: 1.0
}).setView([-22.794, -43.251], 10);

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
        opacity: 0.5,
        fillOpacity: 0.15
    },
    "milicia": {
        radius: 2.5,
        fillColor: "#11CE5C",
        color: "#000",
        stroke: false,
        weight: 1,
        opacity: 0.5,
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

function filterByDateRange(greater_than_date, less_than_date) {
    if (map.hasLayer(makerLayers["milicia"])) {
        map.removeLayer(makerLayers["milicia"]);
    }
    if (map.hasLayer(makerLayers["faccao"])) {
        map.removeLayer(makerLayers["faccao"]);
    }

    makerLayers["milicia"] = new L.featureGroup();
    makerLayers["faccao"] = new L.featureGroup();

    geoData.features.forEach((feature, index) => {
        let featureDate =  new Date(feature.properties.data);
        if (featureDate <= less_than_date && featureDate >= greater_than_date) {
            if (feature.properties.organizaca == 'milicia' ){
                makerLayers["milicia"].addLayer(markers[feature.properties.id]);
            }
            if (feature.properties.organizaca == 'faccao' ){
                makerLayers["faccao"].addLayer(markers[feature.properties.id]);
            }
        }
    });

    makerLayers["milicia"].addTo(map);
    makerLayers["faccao"].addTo(map);
}

var startDate,
    endDate;

let margin = {top: 25, right: 30, bottom: 20, left: 30},
    width = $(window).width() - margin.left - margin.right,
    height = 130 - margin.top - margin.bottom;

let canvas = d3.select("#info-map-controls")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("id", "graph")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

let graphLayer = canvas.append('g').attr("class", "graph-layer"),
    axesLayer = canvas.append('g').attr("class", "axes-layer");

let x = d3.scaleLinear()
    .range([0, width]);

let y = d3.scalePow()
    .exponent(.3)
    .range([height, 0]);

let colors = d3.scaleOrdinal(["#8280FF", "#11CE5C"]);

let xAxis = d3.axisBottom(x)
    .tickSize(-height)
    .ticks(8)
    .tickPadding(4)
    .tickFormat(d3.timeFormat("%b - %y"));

let bottomXAxis = d3.axisBottom(x)
    .tickSize(4)
    .ticks(width/100);

let yAxis = d3.axisLeft(y)
    .tickValues([0, 1])
    .tickSize(-width)
    .tickPadding(-100)
    .tickFormat(function(d) {
        return d === 350 ? d + " denúncias" : d;
    });

let clip = canvas.append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("width", width)
  .attr("height", height);

let gXAxis = axesLayer.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (height + 3) + ")")
    .call(xAxis);

let gBottomXAxis = axesLayer.append("g")
    .attr("class", "x axis bottom")
    .attr("transform", "translate(0," + height + ")")
    .call(bottomXAxis);

let gYAxis = axesLayer.append("g")
    .attr("class", "y axis")
    .call(yAxis);

d3.csv("data/timeline.csv", function(d) {
    d.month = new Date(d.month);
    d.faccao = +d.faccao;
    d.milicia = +d.milicia;
    return d;
}, function(error, data) {
    let organizations = data.columns.slice(1).map(function(id) {
        return {
            id: id,
            values: data.map(function(d) {
                return {month: d.month, count: d[id]};
            })
        };
      });

    let valueline = d3.line()
        .curve(d3.curveMonotoneX)
        .x(function(d) { return x(d.month); })
        .y(function(d) { return y(d.count); });

    x.domain(d3.extent(data, function(d) { return d.month; }));
    y.domain([
        d3.min([
            d3.min(data, function(d) { return d.milicia; }),
            d3.min(data, function(d) { return d.faccao; }),
        ]),
        d3.max([
            d3.max(data, function(d) { return d.milicia; }),
            d3.max(data, function(d) { return d.faccao; }),
        ])
    ]).nice();

    yAxis.tickValues([150, 250, 350]);

    let axesLayer = d3.select(".axes-layer");

    let organisation = axesLayer.selectAll(".organisation")
        .data(organizations)
        .enter().append("g")
            .attr("class", "organisation");

      organisation.append("path")
            .attr("class", "line")
            .attr("clip-path", "url(#clip)")
            .attr("d", function(d) { return valueline(d.values); })
            .style("stroke", function(d) { return colors(d.id); });

    gXAxis.call(xAxis);
    gBottomXAxis.call(bottomXAxis);
    gYAxis.call(yAxis)
        .call(function(g) {
            g.selectAll("text")
                .attr("x", 4)
                .attr("dy", -4)
                .style("text-anchor", "start")
        });


    startDate = new Date(x.invert(startSliderThumb.node().offsetLeft));
    endDate = new Date(x.invert(endSliderThumb.node().offsetLeft));

    d3.select(window).on('resize', function() {
        width = $(window).width() - margin.left - margin.right;
        x.range([0, width]);
        xAxis.ticks(Math.max(width/100, 2));
        bottomXAxis.ticks(Math.max(width/100, 2));
        gXAxis.call(xAxis);
        gBottomXAxis.call(bottomXAxis);

        organisation.selectAll("path")
            .attr("d", function(d) { return valueline(d.values); });
        clip.attr("width", width);

        let startSlidePosition = Math.round(x(startDate)),
            endSliderPosition = Math.round(x(endDate));

        startSlider.updatePosition(startSlidePosition);
        endSlider.updatePosition(endSliderPosition);

        selection.attr("x", startSlidePosition);
        selection.attr("width", endSliderPosition - startSlidePosition);
    });
});


let controller = d3.select("#info-map-controls");

let sliderLayer = canvas.append('g').attr("class", "slider-layer")

let rangeStart = 0,
    rangeEnd = width + margin.right,
    startSlider = controller
        .append("div")
        .attr("class", "slider slider-start"),
    endSlider = controller
        .append("div")
        .attr("class", "slider slider-end"),
    startSliderThumb = startSlider
        .append("div")
        .attr("class", "slider-thumb")
        .style("left", rangeStart + "px"),
    startSliderHandle = startSliderThumb
        .append("div")
        .attr("class", "slider-handle-start"),
    endSliderThumb = endSlider
        .append("div")
        .attr("class", "slider-thumb")
        .style("left", rangeEnd + "px"),
    endSliderHandle = endSliderThumb
        .append("div")
        .attr("class", "slider-handle-end"),
    startMarker = sliderLayer.append("g")
        .attr("class", "marker marker-start"),
    startGuideline = startMarker.append("line")
        .attr("class", "guideline guideline-start")
        .attr("x1", rangeStart)
        .attr("y1", -height)
        .attr("x2", rangeStart)
        .attr("y2", height),
    endMarker = sliderLayer.append("g")
        .attr("class", "marker marker-end"),
    endGuideline = endMarker.append("line")
        .attr("class", "guideline guideline-end")
        .attr("x1", rangeEnd - margin.left)
        .attr("y1", -height)
        .attr("x2", rangeEnd - margin.left)
        .attr("y2", height);

let selection = sliderLayer.append("rect")
    .attr("id", "selection")
    .attr("class", "selection")
    .attr("x", startSliderThumb.node().offsetLeft)
    .attr("y", 0 - margin.top)
    .attr("height", height + margin.top)
    .attr("width", endSliderThumb.node().offsetLeft - startSliderThumb.node().offsetLeft - margin.left)
    .call(
        d3.drag().on("drag", function(){
            let position = +this.getAttribute("x") + d3.event.dx,
                selectionWidth = position + +selection.attr("width");

            if (position < 0 || selectionWidth > width) return;

            selection.attr("x", position);
            startSlider.updatePosition(position);
            endSlider.updatePosition(selectionWidth);

            startDate = (x.invert(position));
            endDate = (x.invert(selectionWidth));

            filterByDateRange(startDate, endDate);
        })
    );

startSlider.updatePosition = function(position) {
    $(".slider.slider-start .slider-thumb").css({left: position});
    startMarker.attr("transform", "translate(" + (position - rangeStart) + "," + 0 + ")");
}
endSlider.updatePosition = function(position) {
    $(".slider.slider-end .slider-thumb").css({left: position + margin.left});
    endMarker.attr("transform", "translate(" + (position - rangeEnd + margin.left) + "," + 0 + ")");
}

$(".slider .slider-thumb").draggable({
    axis: "x",
    start : function() {
        startGuideline.classed("drag", true);
        endGuideline.classed("drag", true);
    },
    drag: function(event, ui) {
        let startSlidePosition = startSliderThumb.node().offsetLeft,
            endSliderPosition = endSliderThumb.node().offsetLeft;
        if (this.parentElement.className == "slider slider-end") {
            ui.position.left = Math.max(ui.position.left, startSlidePosition + margin.left);
            ui.position.left = Math.min(margin.left + width, ui.position.left);
            endMarker.attr("transform", "translate(" + (ui.position.left - rangeEnd) + "," + 0 + ")");
        }
        else if (this.parentElement.className == "slider slider-start") {
            ui.position.left = Math.min(ui.position.left, endSliderPosition - margin.left);
            ui.position.left = Math.max(0, ui.position.left);
            startMarker.attr("transform", "translate(" + (ui.position.left - rangeStart) + "," + 0 + ")");
        }
        selection.attr("x", startSlidePosition);
        selection.attr("width", endSliderPosition - startSlidePosition - margin.left);
    },
    stop : function() {
        let startSlidePosition = startSliderThumb.node().offsetLeft,
            endSliderPosition = endSliderThumb.node().offsetLeft;
        selection.attr("x", startSlidePosition);
        selection.attr("width", endSliderPosition - startSlidePosition - margin.left);

        startDate = new Date(x.invert(startSlidePosition));
        endDate = new Date(x.invert(endSliderPosition));

        filterByDateRange(startDate, endDate);
        startGuideline.classed("drag", false);
        endGuideline.classed("drag", false);
    }
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
