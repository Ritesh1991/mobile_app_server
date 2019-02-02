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
    .attr('data-uuid', printer.uuid)
    .on('click', function () {
      d3.event.stopPropagation();
      d3.event.preventDefault();

      svg.select('.camera-checked').classed('camera-checked', false);

      Session.set('cameraId', printer._id);

      svg.select('[data-mongo-id=\'' + printer._id + '\']').classed('camera-checked', true);
    });
}

Template.floorplan.onCreated(function () {
  var template = this;
  template.isMapReady = new ReactiveVar(false);
  template.currentCoords = new ReactiveVar();
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
      self.currentCoords.set(d3.mouse(this));

      if (self.current_circle) {
        self.current_circle.remove();
      }
      //TODO: Remember not to delete it once we actually save it!
      self.current_circle = svg.append('circle')
        .attr('cx', self.currentCoords.get()[0])
        .attr('cy', self.currentCoords.get()[1])
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

Template.floorplan.onDestroyed(function() { 
  Session.set('cameraId', null);
});

Template.floorplan.helpers({
  cameraId: function () {
    return Session.get('cameraId');
  }
});