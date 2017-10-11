/*
 * Copyright 2016 Anton Tananaev (anton@traccar.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var url = 'http://localhost:8082';
var token = 'TOKEN';

var style = new ol.style.Style({
    image: new ol.style.Circle({
        fill: new ol.style.Fill({
            color: 'teal'
        }),
        stroke: new ol.style.Stroke({
            color: 'navy',
            width: 2
        }),
        radius: 7
    })
});

var source = new ol.source.Vector();

var markers = {};

var map = new ol.Map({
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        }),
        new ol.layer.Vector({
            source: source
        })
    ],
    target: 'map',
    view: new ol.View({
        center: ol.proj.fromLonLat([0, 0]),
        zoom: 2
    })
});

var ajax = function (method, url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open(method, url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            callback(JSON.parse(xhr.responseText));
        }
    };
    if (method == 'POST') {
        xhr.setRequestHeader('Content-type', 'application/json');
    }
    xhr.send()
};

ajax('GET', url + '/api/session?token=' + token, function(user) {
    ajax('GET', url + '/api/devices', function(devices) {

        var socket = new WebSocket('ws' + url.substring(4) + '/api/socket');

        socket.onclose = function (event) {
            console.log('socket closed');
        };

        socket.onmessage = function (event) {
            var data = JSON.parse(event.data);
            if (data.positions) {
                for (i = 0; i < data.positions.length; i++) {
                    var position = data.positions[i];
                    var marker = markers[position.deviceId];
                    var point = new ol.geom.Point(ol.proj.fromLonLat([position.longitude, position.latitude]));
                    if (!marker) {
                        marker = new ol.Feature(point);
                        marker.setStyle(style);
                        markers[position.deviceId] = marker;
                        source.addFeature(marker);
                    } else {
                        marker.setGeometry(point);
                    }
                }
            }
        };

    });
});
