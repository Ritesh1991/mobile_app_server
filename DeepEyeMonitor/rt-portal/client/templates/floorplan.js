current_coords = new ReactiveVar([]);
svg = null;
map_ready = new ReactiveVar(false);
selected_printer_id = new ReactiveVar();
selected_circle = null;

function cameraAdded(printer) {
  //console.log("printer", printer);
  var svg = d3.selectAll('svg');
  //console.log(svg);
  svg.attr('preserveAspectRatio', 'xMidYMid meet'); 
  
  svg.append('svg:image')
    .attr('x', printer.coordinates[0])
    .attr('y', printer.coordinates[1])
    .attr('xlink:href', '/camera@3x.png')
    .attr('width', 40)
    .attr('height', 40)
    .attr('data-mongo-id', printer._id)
    .attr('data-uuid', printer.uuid);
    // .on('click', function (d, i, nodes) {
      //if something was selected, restore it
      // if (selected_circle) {
      //   console.log(selected_circle.style('fill'));
      //   console.log(d3.color('red'));
      //   if (selected_circle.style('fill') == d3.color('red')) {
      //     selected_circle.remove();
      //   } else {
      //     selected_circle.style('fill', 'purple');
      //   }
      // }

      // d3.event.stopPropagation();
      // d3.event.preventDefault();
      // selected_circle = d3.select(d3.event.target);
      // var related_printer = selected_circle.attr('data-mongo-id');
      // //console.log(d3.select(d3.event.target).attr("data-mongo-id"));
      // selected_printer_id.set(related_printer);

      //color the new one
      //selected_circle.style("fill", "green");

    // });

  //svg.append('svg:image')
  //  .attr('xlink:href', 'http://www.iconpng.com/png/beautiful_flat_color/computer.png')
  //  .attr('x',printer.coordinates[0])
  //  .attr('y',printer.coordinates[1])
  //  .attr('width', 40)
  //  .attr('height', 40)
}

Template.floorplan.onCreated(function () {
  var template = this;
  template.isMapReady = new ReactiveVar(false);
  template.current_coords = new ReactiveVar();
  template.currentCircile = null;
});

Template.floorplan.onRendered(function () {
  var self = this;
  d3.select('htmlEmbed').classed('svg-container', true);
  d3.xml('/sh-floor.svg', function (xml) {
    document.getElementById('htmlEmbed').appendChild(xml.documentElement);
    var svg = d3.selectAll('svg');
    //console.log(svg);
    svg.attr('preserveAspectRatio', 'xMidYMid meet');
    //.attr("viewBox", "0 0 1870 1210");

    svg.on('click', function () { //TODO: Move into meteor event? cant do that
      self.current_coords.set(d3.mouse(this));

      if (self.current_circle) {
        self.current_circle.remove();
      }
      //TODO: Remember not to delete it once we actually save it!
      self.current_circle = svg.append('circle')
        .attr('cx', self.current_coords.get()[0])
        .attr('cy', self.current_coords.get()[1])
        .attr('r', 8)
        .style('fill', 'red');
    });
    self.isMapReady.set(true);
  });

  Tracker.autorun(function () {
    if (self.isMapReady.get()) {
      //populate_map();
      Meteor.subscribe('getCameras', function () {
        console.log('stuff ready?');
      });
    }
  });
  Cameras.find().observe({
    added: function (doc) {
      console.log('camera added ', doc);
      cameraAdded(doc);
    }
  });
});

Template.floorplan.events({
  // 'click circle': function (event) {
  //   event.preventDefault();
  //   event.stopPropagation();
  //   console.log(event.target);
  // }
});