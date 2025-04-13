odoo.define('wine_region_map.MapWidget', function (require) {
    "use strict";

    var Widget = require('web.Widget');
    var registry = require('web.widget_registry');
    var rpc = require('web.rpc');
    var Dialog = require('web.Dialog');

    var WineRegionMapWidget = Widget.extend({
        template: 'wine_region_map.MapTemplate',
        cssLibs: [
            '/wine_region_map/static/lib/leaflet/leaflet.css',
            '/wine_region_map/static/src/scss/map_style.scss'
        ],
        jsLibs: [
            '/wine_region_map/static/lib/leaflet/leaflet.js'
        ],

        init: function (parent, options) {
            this._super.apply(this, arguments);
            this.mapId = options.mapId;
            this.mapConfig = null;
            this.map = null;
            this.regionLayers = {};
        },

        willStart: function () {
            var self = this;
            return this._super.apply(this, arguments).then(function () {
                return self._loadMapData();
            });
        },

        start: function () {
            var self = this;
            return this._super.apply(this, arguments).then(function () {
                self._initMap();
                self._renderRegions();
                // Añadir control de búsqueda
                self._addSearchControl();
            });
        },

        _loadMapData: function () {
            return rpc.query({
                model: 'wine.region.map',
                method: 'get_map_config',
                args: [[this.mapId]],
            }).then(function (config) {
                this.mapConfig = config;
            }.bind(this));
        },

        _initMap: function () {
            this.map = L.map(this.$('.wine-map-container')[0], {
                scrollWheelZoom: false,
                dragging: true,
                tap: false
            }).setView(
                [this.mapConfig.default_lat, this.mapConfig.default_lng],
                this.mapConfig.default_zoom
            );

            // Capa base minimalista
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.map);
        },

        _renderRegions: function () {
            var self = this;
            this.mapConfig.regions.forEach(function (region) {
                try {
                    var geoJson = JSON.parse(region.geo_data);
                    var regionLayer = L.geoJSON(geoJson, {
                        style: {
                            fillColor: region.color,
                            color: region.color,
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.6
                        },
                        onEachFeature: function (feature, layer) {
                            layer.on({
                                mouseover: function(e) {
                                    this.setStyle({
                                        fillOpacity: 0.9,
                                        weight: 2
                                    });
                                    this.bringToFront();
                                    self.$('.map-title').text(region.name);
                                    self.$('.map-subtitle').text(region.country_name);
                                },
                                mouseout: function(e) {
                                    this.setStyle({
                                        fillOpacity: 0.6,
                                        weight: 1
                                    });
                                    self.$('.map-title').text("Seleccione una región");
                                    self.$('.map-subtitle').text("");
                                },
                                click: function(e) {
                                    self._showRegionDetails(region.id);
                                }
                            });
                        }
                    }).addTo(self.map);
                    self.regionLayers[region.id] = regionLayer;
                } catch (e) {
                    console.error("Error parsing GeoJSON for region " + region.id, e);
                }
            });
        },

        _addSearchControl: function() {
            var self = this;
            var regions = this.mapConfig.regions.map(function(region) {
                return {
                    name: region.name + ', ' + region.country_name,
                    id: region.id
                };
            });
            
            var searchControl = L.control.search({
                layer: L.layerGroup(Object.values(this.regionLayers)),
                propertyName: 'name',
                initial: false,
                zoom: 8,
                textPlaceholder: 'Buscar región...',
                sourceData: function(text, callback) {
                    var results = regions.filter(function(region) {
                        return region.name.toLowerCase().includes(text.toLowerCase());
                    });
                    callback(results);
                }
            });
            
            searchControl.on('search:locationfound', function(e) {
                self._showRegionDetails(e.layer.feature.id);
            }).addTo(this.map);
        },

        _showRegionDetails: function(regionId) {
            var self = this;
            rpc.query({
                model: 'wine.region',
                method: 'read',
                args: [[regionId], ['name', 'description', 'image', 'climate', 'soil', 'grapes', 'producers_ids', 'wine_ids']],
            }).then(function (result) {
                if (result && result[0]) {
                    var region = result[0];
                    var dialog = new Dialog(this, {
                        title: region.name,
                        size: 'large',
                        $content: $('<div>', {
                            class: 'region-detail-container row'
                        }).append(
                            $('<div>', {
                                class: 'col-md-4'
                            }).append(
                                $('<img>', {
                                    src: '/web/image/wine.region/' + regionId + '/image',
                                    class: 'img-fluid mb-3'
                                }),
                                $('<h4>').text('Clima'),
                                $('<div>').html(region.climate || 'No disponible'),
                                $('<h4>').text('Suelo'),
                                $('<div>').html(region.soil || 'No disponible'),
                                $('<h4>').text('Uvas Principales'),
                                $('<div>').html(region.grapes || 'No disponible')
                            ),
                            $('<div>', {
                                class: 'col-md-8'
                            }).append(
                                $('<div>').html(region.description || 'Descripción no disponible'),
                                $('<hr>'),
                                $('<h4>').text('Productores destacados'),
                                $('<div>', {
                                    class: 'producer-tags'
                                }),
                                $('<h4>', {
                                    class: 'mt-3'
                                }).text('Vinos de esta región')
                            )
                        ),
                        buttons: [
                            {text: "Cerrar", close: true}
                        ],
                    });
                    
                    dialog.opened().then(function() {
                        // Cargar productores
                        if (region.producers_ids && region.producers_ids.length > 0) {
                            rpc.query({
                                model: 'wine.producer',
                                method: 'read',
                                args: [region.producers_ids, ['name']],
                            }).then(function(producers) {
                                producers.forEach(function(producer) {
                                    dialog.$content.find('.producer-tags').append(
                                        $('<span>', {
                                            class: 'badge badge-primary mr-2 mb-2'
                                        }).text(producer.name)
                                    );
                                });
                            });
                        }
                    });
                    
                    dialog.open();
                }
            });
        },
    });

    registry.add('wine_region_map_widget', WineRegionMapWidget);
    return WineRegionMapWidget;
});