//var svg = d3.select("#htmlEmbed").append("svg:image")
//    .attr("src","/public/1.svg")
//.attr('preserveAspectRatio')
//.attr("width", 1000)
//.attr("height", 1000);
if (Meteor.isClient) {
  Meteor.startup(function () {

    current_coords = new ReactiveVar();
    svg = null;
    map_ready = new ReactiveVar(false);
    selected_printer_id = new ReactiveVar();
    selected_circle = null;



    function cameraAdded(printer) {
      //console.log("printer", printer);

      svg.append('svg:image')
        .attr('x', printer.coordinates[0])
        .attr('y', printer.coordinates[1])
        .attr('xlink:href', '/camera.png')
        .attr('width', 120)
        .attr('height', 120)
        .attr('data-mongo-id', printer._id)
        .attr('data-uuid', printer.uuid)
        .on('click', function (d, i, nodes) {
          //if something was selected, restore it
          if (selected_circle) {
            console.log(selected_circle.style('fill'));
            console.log(d3.color('red'));
            if (selected_circle.style('fill') == d3.color('red')) {
              selected_circle.remove();
            } else {
              selected_circle.style('fill', 'purple');
            }
          }

          d3.event.stopPropagation();
          d3.event.preventDefault();
          selected_circle = d3.select(d3.event.target);
          var related_printer = selected_circle.attr('data-mongo-id');
          //console.log(d3.select(d3.event.target).attr("data-mongo-id"));
          selected_printer_id.set(related_printer);

          //color the new one
          //selected_circle.style("fill", "green");

        });

      //svg.append('svg:image')
      //  .attr('xlink:href', 'http://www.iconpng.com/png/beautiful_flat_color/computer.png')
      //  .attr('x',printer.coordinates[0])
      //  .attr('y',printer.coordinates[1])
      //  .attr('width', 40)
      //  .attr('height', 40)
    }
    var populate_map = function () {
      var cursor = Cameras.find();
      cursor.forEach(cameraAdded);
    };

    Template.info.helpers({
      'current_printer': function () {
        //console.log(selected_printer_id.get());
        return Cameras.findOne({
          _id: selected_printer_id.get()
        });
      }
    });

    Template.info.events({
      'click .btn': function (event) {
        event.preventDefault();
        event.stopPropagation();
        Cameras.remove({
          _id: this._id
        });
        console.log(event.target);
        selected_circle.remove();
      }
    });
  });
}