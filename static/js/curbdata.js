var APIKey = "HyursDSMdzrAfLroxKO1rztA5";
var SIDEWALKS_URL = "https://data.seattle.gov/resource/pxgh-b4sz.json"

// Starting location
var myCenter = new google.maps.LatLng(47.606115, -122.335834);

// Make the map
addCurbs = function(map) {
  var curbLength = 2e-5;
  var curbWingSize = 1e-5;
  var sidewalkCols = ["objectid", "condition", "curbramphighyn", "curbramplowyn", "shape", "current_status"]
  var params = {
        "$select": sidewalkCols.join(","),
        "$limit": 1000, // FIXME: modify this in the final version to retrieve all curbs
        "curbramphighyn": "Y",
        "curbramplowyn": "Y",
        "current_status": "INSVC"
      }

  var url = SIDEWALKS_URL + "?" + $.param(params)
  $.ajax({
    url: SIDEWALKS_URL,
    dataType: "json",
    data: params,
    headers: {"X-App-Token": APIKey},
    success: function(data) {
      for (var i=0; i < data.length; i++) {
        shape = data[i]["shape"]
        paths = shape["geometry"]["paths"][0]
        // NOTE: All non-terminal curbs are ignored (i.e. if there's
        // a cross-walk mid-way down the block with a curb, it's ignored
        // Get first curb location and equation for line

        curbDrawLengthCoordinates = function(curbLocation, slope, length) {
          dx = Math.sqrt(Math.pow(length, 2) / (Math.pow(slope, 2) + 1));
          dy = slope * dx;
          return [[curbLocation[0] - dx, curbLocation[1] - dy],
                  [curbLocation[0] + dx, curbLocation[1] + dy]];
        }

        drawCurb = function(coord, map) {
          coordinates = [new google.maps.LatLng(coord[0][0], coord[0][1]),
                         new google.maps.LatLng(coord[1][0], coord[1][1])];
          path = new google.maps.Polyline({
            path: coordinates,
            geodesic: true,
            strokeColor: "#0000FF",
            strokeOpacity: 0.6,
            strokeWeight:3
          });
          path.setMap(map);
        }

        // Calculate characteristics of curb - its position and the slope
        // of the incoming sidewalk. Eventually this would be linalg
        curb0LatLng = [paths[0][1], paths[0][0]];
        curb0PrevPoint = [paths[1][1], paths[1][0]];
        dLat0 = curb0PrevPoint[0] - curb0LatLng[0];
        dLong0  = curb0PrevPoint[1] - curb0LatLng[1];
        slope0 = dLat0 / dLong0;
        invSlope0 = 1 / slope0;

        curb1LatLng = [paths[paths.length - 1][1], paths[paths.length - 1][0]];
        curb1PrevPoint = [paths[paths.length - 2][1], paths[paths.length - 2][0]];
        dLat1 = curb1PrevPoint[0] - curb1LatLng[0];
        dLong1  = curb1PrevPoint[1] - curb1LatLng[1];
        slope1 = dLat1 / dLong1;
        invSlope1 = 1 / slope1;

        coord0 = curbDrawLengthCoordinates(curb0LatLng, invSlope0, curbLength);
        coord1 = curbDrawLengthCoordinates(curb1LatLng, invSlope1, curbLength);


        drawCurb(coord0, map);
        drawCurb(coord1, map);
      }
    }
  });
}
