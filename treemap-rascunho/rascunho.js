var data = (function() {
  var json = null;
  $.ajax({
    async: false,
    global: false,
    url:"data.json",
    dataType: "json",
    success: function(data) {
      json = data;
    }
  });
  return json;
})();


new d3plus.Treemap()
  .data(data)
  .container("#chart")
  .groupBy(["cidade", "bairro", "organizacao"])
  .shapeConfig({fill: function(d) { return d.color; }})
  .render();
