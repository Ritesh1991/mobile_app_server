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

    Template.floorplan.onRendered(function () {
      map_ready.set(false);
      d3.select('htmlEmbed').classed('svg-container', true);

      d3.xml('/floor2.svg', function (xml) {
        document.getElementById('htmlEmbed').appendChild(xml.documentElement);
        svg = d3.selectAll('svg');
        //console.log(svg);
        svg.attr('preserveAspectRatio', 'xMidYMid meet');
        //.attr("viewBox", "0 0 1870 1210");

        var current_circle;
        svg.on('click', function () { //TODO: Move into meteor event? cant do that
          current_coords.set(d3.mouse(this));

          if (selected_circle) { //TODO: change this into a function or something
            //selected_circle.style("fill", "purple");
            selected_circle = null;
            //selected_printer_id.set(null); //undo
          }
          if (current_circle) {
            current_circle.remove();
          }
          //TODO: Remember not to delete it once we actually save it!
          current_circle = svg.append('circle')
            .attr('cx', d3.mouse(this)[0])
            .attr('cy', d3.mouse(this)[1])
            .attr('r', 16).style('fill', 'red');
          selected_printer_id.set(null);
          selected_circle = current_circle;

        });
        map_ready.set(true);

        Tracker.autorun(function () {
          if (map_ready.get()) {
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
    });
    /*Template.floorplan.events({
            'click circle': function(event){
                event.preventDefault();
                event.stopPropagation();
                console.log(event.target);
            }
        });*/

    Template.floorplan.onCreated(function () {});

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

    Template.devicesList.events({
      'submit': function (event) {
        event.preventDefault();
        //console.log(event);
        var target = event.target;
        var uuid = this.uuid;
        var name = this.name;
        var printer = {
          uuid: uuid,
          name: name
        };

        if (!selected_printer_id.get()) { //no printer selected
          if (current_coords.get()) {
            //console.log(printer);
            printer.coordinates = current_coords.get();
            Cameras.insert(printer);
            Materialize.toast('Printer successfully added');
            event.target.reset();
          } else {
            Materialize.toast('Please choose a location and fill out the required information', 4000);
          }
        } else { //update the printer
          old_printer = Cameras.findOne({
            _id: selected_printer_id.get()
          });
          delete old_printer._id;
          _.each(printer, function (value, key) {
            if (value) {
              old_printer[key] = value;
            }
          });
          Cameras.update({
            _id: selected_printer_id.get()
          }, {
            $set: old_printer
          });
        }
      }
    });

    Template.devicesList.onRendered(function () {
      /*$('#make').autocomplete({
                data: {
                    "Lexmark": null,
                    "HP": null,
                    "Ricoh": null
                }
            })*/
    });
    Template.devicesList.helpers({
      'devices': function () {
        //console.log(selected_printer_id.get());
        return Devices.find();
      },
      'groupName': function (groupId) {
        var group = SimpleChatGroups.findOne({
          _id: groupId
        });
        if (group) {
          return group.name;
        }
      },
      'latestImage': function (uuid) {
        var data = TimelineLists.findOne({
          uuid: uuid
        });
        if (data) {
          return data.img_url;
        }
      }
    });

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