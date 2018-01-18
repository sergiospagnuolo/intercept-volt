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
    axesLayer = canvas.append('g').attr("class", "axes-layer"),
    sliderLayer = canvas.append('g').attr("class", "slider-layer");

let x = d3.scaleLinear()
    .range([0, width]);

let y = d3.scalePow()
    .exponent(.3)
    .range([height, 0]);

let colors = d3.scaleOrdinal(["#ae31d7", "#34d7ac"]);

let xAxis = d3.axisBottom(x)
    .tickSize(-height)
    .tickFormat(d3.timeFormat("%b/%y"));

let bottomXAxis = d3.axisBottom(x)
    .tickSize(4)
    .ticks(width/100);

let yAxis = d3.axisLeft(y)
    .tickValues([0, 1])
    .tickSize(-width)
    .tickPadding(-100)
    .tickFormat(function(d) {
        return d === 350 ? d + " ocorrências" : d;
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
        .curve(d3.curveLinear)
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
    });
});
