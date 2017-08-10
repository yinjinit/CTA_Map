(function(window, google){
    var stationsCrimes = [];
    var options={
        center:{
            lat:41.8781,
            lng:-87.6298
        },
        zoom:8,
        styles:[
            {"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.business","elementType":"geometry.fill","stylers":[{"visibility":"on"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#b4d4e1"},{"visibility":"on"}]}
        ]
    }

    map= Mapster.create(document.getElementById('map-canvas'), options);

    var line_colors = ['blue', 'brown', 'green', 'orange', 'pink', 'purple', 'red', 'yellow'];
    for(var i=0; i<8; i++) {
        var kmlLayer = new google.maps.KmlLayer(encodeURI('http://207.176.216.113/CTA_Map/assets/db/RailLines/'+line_colors[i]+'_line.kml'));
        kmlLayer.setMap(map.gMap);
    }

    var infowindow = new google.maps.InfoWindow({
        position: {lat: -28.643387, lng: 153.612224},
        pixelOffset: new google.maps.Size(0, -60)
    });

    d3.json("assets/db/Lstop_crimes.json", function(error, data) {
        if(error) throw error;

        stationsCrimes = data;           

        d3.json("assets/db/CTA-locations.geojson", function(error, data) {
            if(error) throw error;

            var ranked_data = [];

            for(var i=0; i<data.features.length; i++) {
                var feature = data.features[i];
                var coord = feature.properties.Location.replace('(','').replace(')','').split(',');
                var lat = parseFloat(coord[0]);
                var lng = parseFloat(coord[1]);
                var colors = [];
                var involvedColors = [];

                if(feature.properties.RED==1) { colors.push('d22030'); involvedColors.push('Red'); } 
                if(feature.properties.BLUE==1) { colors.push('01a1dd'); involvedColors.push('Blue'); } 
                if(feature.properties.Green==1) { colors.push('00974d'); involvedColors.push('Green'); } 
                if(feature.properties.Brown==1) { colors.push('643d20'); involvedColors.push('Brown'); } 
                if(feature.properties.Purple==1) { colors.push('3b2d83'); involvedColors.push('Purple'); } 
                if(feature.properties.Yellow==1) { colors.push('fcd804'); involvedColors.push('Yellow'); }
                if(feature.properties.Pink==1) { colors.push('ec83a6'); involvedColors.push('Pink'); }
                if(feature.properties.Orange==1){ colors.push('ef4a25'); involvedColors.push('Orange'); }

                var crimesInfo = null;

                for(var j=0; j<stationsCrimes.length; j++) {

                    var stationName = stationsCrimes[j]['Stations'];

                    if(stationName.indexOf(feature.properties.STATION_NAME)>=0 ) {
                        for(var k=0; k<involvedColors.length; k++) {
                            if(stationName.indexOf(involvedColors[k])==-1) {
                                break;
                            }
                        }

                        if(k==involvedColors.length) {
                            crimesInfo = stationsCrimes[j];
                            break;                                
                        }
                    }
                }

                feature.crimesInfo = crimesInfo;

                if(crimesInfo && crimesInfo.Ranking && crimesInfo.Ranking<11) {
                    ranked_data.push(feature);
                }

                createMarker( new google.maps.LatLng({
                    lat: lat, 
                    lng: lng
                    }), feature.properties.STATION_NAME, crimesInfo, colors);
            }

            var overlay = new google.maps.OverlayView();

            // Add the container when the overlay is added to the map.
            overlay.onAdd = function() {
                var layer = d3.select(this.getPanes().overlayLayer).append("div").attr("class", "stations");

                // Draw each marker as a separate SVG element.
                // We could use a single SVG, but what size would it have?
                overlay.draw = function() {
                    var projection = this.getProjection(),
                    padding = 10;

                    var marker = layer.selectAll("svg")
                    .data(ranked_data)
                    .each(transform) // update existing markers
                    .enter().append("svg")
                    .each(transform)
                    .attr("class", "marker pulse");

                    // Add a circle.
                    marker.append("path")
                    .attr("d", "m24.847991,12.348467c0,9.08714 -10.258581,17.503067 -10.258581,17.503067c-0.599417,0.491781 -1.580412,0.491781 -2.179829,0c0,0 -10.258581,-8.415927 -10.258581,-17.503067c0.000114,-6.267601 5.08098,-11.348467 11.348524,-11.348467s11.348467,5.080866 11.348467,11.348467z")
                    .style('fill', function(d) {
                        var colors = [];

                        if(d.properties.RED==1) { colors.push('d22030'); } 
                        if(d.properties.BLUE==1) { colors.push('01a1dd'); } 
                        if(d.properties.Green==1) { colors.push('00974d'); } 
                        if(d.properties.Brown==1) { colors.push('643d20'); } 
                        if(d.properties.Purple==1) { colors.push('3b2d83'); } 
                        if(d.properties.Yellow==1) { colors.push('fcd804'); }
                        if(d.properties.Pink==1) { colors.push('ec83a6'); }
                        if(d.properties.Orange==1){ colors.push('ef4a25'); }

                        var fillColor = colors[0];

                        for(var i=1; i<colors.length; i++) {
                            fillColor = parseInt((parseInt(fillColor, 16) + parseInt(colors[i], 16))/2).toString(16);

                            while (fillColor.length < 6) { fillColor = '0' + fillColor; }
                        }

                        return '#' + fillColor;
                    })
                    .style('fill-opacity', 0.8);

                    function transform(d) {
                        var coord = d.properties.Location.replace('(','').replace(')','').split(',');
                        var lat = parseFloat(coord[0]);
                        var lng = parseFloat(coord[1]);

                        d = new google.maps.LatLng(lat, lng);
                        d = projection.fromLatLngToDivPixel(d);
                        return d3.select(this)
                        .style("left", (d.x - padding) + "px")
                        .style("top", (d.y - padding) + "px");
                    }
                };
            };

            // Bind our overlay to the map�
            overlay.setMap(map.gMap);            
        });
    });

    function createMarker(latlng, name, crimesInfo, colors) {

        var fillColor = colors[0];

        for(var i=1; i<colors.length; i++) {
            fillColor = parseInt((parseInt(fillColor, 16) + parseInt(colors[i], 16))/2).toString(16);

            while (fillColor.length < 6) { fillColor = '0' + fillColor; }
        }

        var icon = {
            path: "m24.847991,12.348467c0,9.08714 -10.258581,17.503067 -10.258581,17.503067c-0.599417,0.491781 -1.580412,0.491781 -2.179829,0c0,0 -10.258581,-8.415927 -10.258581,-17.503067c0.000114,-6.267601 5.08098,-11.348467 11.348524,-11.348467s11.348467,5.080866 11.348467,11.348467z",
            fillColor: '#' + fillColor,
            fillOpacity: .8,
            anchor: new google.maps.Point(14,30),
            labelOrigin: new google.maps.Point(14, 15),
            strokeWeight: 0,
            scale: 1
        }

        var markerOpts = {
            position: latlng,
            map: map.gMap,
            icon: icon,
            zIndex: Math.round(latlng.lat()*-100000)<<5
        };

        if(crimesInfo && crimesInfo.Ranking) {
            markerOpts['label'] = {
                text: crimesInfo.Ranking.toString(),
                fontSize: "12px",
                fontWeight: "bold"
            };
        }

        var marker = new google.maps.Marker(markerOpts);

        marker.crimesInfo = crimesInfo;

        marker.addListener('click', function() {
            map.gMap.setZoom(18);
            map.gMap.setCenter(latlng);

            var contentString = '<div id="infobox">'+
            '<h2 id="route"">' + name + '</h2>'+
            '<p><strong>Total Crimes: </strong>' + this.crimesInfo['Total Crimes']+ '</p>'+
            '<p><strong>Assault & Battery: </strong>' + this.crimesInfo['Assault & Battery']+ '</p>'+
            '<p><strong>Theft & Robbery: </strong>' + this.crimesInfo['Theft & Robbery']+ '</p>'+
            '<p><strong>Notes: </strong>' + this.crimesInfo['Notes']+ '</p>'+
            '</div>';

            infowindow.setContent(contentString);
            infowindow.setPosition(latlng);
            infowindow.open(map.gMap);
        });

        return marker;
    }

    google.maps.event.addListener(infowindow, 'domready', function() {
        var iwOuter = $('.gm-style-iw');
        var iwBackground = iwOuter.prev();
        iwBackground.children(':nth-child(2)').css({'display' : 'none'});
        iwBackground.children(':nth-child(4)').css({'display' : 'none'});
        iwBackground.children(':nth-child(3)').css({'z-index' : '5'});
    });
    }(window,window.google)); 