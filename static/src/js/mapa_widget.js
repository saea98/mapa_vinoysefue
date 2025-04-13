if (!odoo.__modules || !odoo.__modules['mapa_vinoysefue.MapaWidget']) {
    odoo.define('mapa_vinoysefue.MapaWidget', function (require) {
        "use strict";

        var Widget = require('web.Widget');
        var registry = require('web.widget_registry');
        var rpc = require('web.rpc');
        var Dialog = require('web.Dialog');

        var MapaVinoYSeFueWidget = Widget.extend({
            template: 'mapa_vinoysefue.mapa_template',
            events: {
                'click .ver-vinos': '_onVerVinosClick',
            },

            init: function (parent, options) {
                this._super.apply(this, arguments);
                this.mapaId = options.mapaId;
                this.mapaConfig = null;
                this.mapa = null;
                this.regionLayers = {};
            },

            willStart: function () {
                var self = this;
                return this._super.apply(this, arguments).then(function () {
                    return self._loadMapaData();
                });
            },

            start: function () {
                var self = this;
                return this._super.apply(this, arguments).then(function () {
                    self._initMapa();
                    self._renderRegiones();
                    self._addSearchControl();
                });
            },

            _loadMapaData: function () {
                return rpc.query({
                    model: 'mapa.vinoysefue',
                    method: 'get_map_config',
                    args: [[this.mapaId]],
                }).then(function (config) {
                    this.mapaConfig = config;
                }.bind(this));
            },

            _initMapa: function () {
                this.mapa = L.map(this.$('.mapa-container')[0], {
                    scrollWheelZoom: true,
                    dragging: true,
                    tap: false
                }).setView(
                    [this.mapaConfig.default_lat, this.mapaConfig.default_lng],
                    this.mapaConfig.default_zoom
                );

                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(this.mapa);
            },

            _renderRegiones: function () {
                var self = this;
                this.mapaConfig.regiones.forEach(function (region) {
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
                                    mouseover: function () {
                                        this.setStyle({
                                            fillOpacity: 0.9,
                                            weight: 2
                                        });
                                        this.bringToFront();
                                        self.$('.mapa-title').text(region.name);
                                        self.$('.mapa-subtitle').text(region.country_name);
                                    },
                                    mouseout: function () {
                                        this.setStyle({
                                            fillOpacity: 0.6,
                                            weight: 1
                                        });
                                        self.$('.mapa-title').text("Seleccione una región");
                                        self.$('.mapa-subtitle').text("");
                                    },
                                    click: function () {
                                        self._showRegionDetalle(region.id);
                                    }
                                });
                            }
                        }).addTo(self.mapa);
                        self.regionLayers[region.id] = regionLayer;
                    } catch (e) {
                        console.error("Error parsing GeoJSON for region " + region.id, e);
                    }
                });
            },

            _addSearchControl: function () {
                var self = this;
                var regiones = this.mapaConfig.regiones.map(function (region) {
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
                    sourceData: function (text, callback) {
                        var results = regiones.filter(function (region) {
                            return region.name.toLowerCase().includes(text.toLowerCase());
                        });
                        callback(results);
                    }
                });

                searchControl.on('search:locationfound', function (e) {
                    self._showRegionDetalle(e.layer.feature.id);
                }).addTo(this.mapa);
            },

            _showRegionDetalle: function (regionId) {
                var self = this;
                rpc.query({
                    model: 'mapa.region',
                    method: 'read',
                    args: [[regionId], ['name', 'description', 'image', 'climate', 'soil', 'grapes', 'producers_ids']],
                }).then(function (result) {
                    if (result && result[0]) {
                        var region = result[0];
                        var dialog = new Dialog(this, {
                            title: region.name,
                            size: 'large',
                            $content: $('<div>', {
                                class: 'region-detalle-container row'
                            }).append(
                                $('<div>', { class: 'col-md-4' }).append(
                                    $('<img>', {
                                        src: '/web/image/mapa.region/' + regionId + '/image',
                                        class: 'img-fluid mb-3'
                                    }),
                                    $('<h4>').text('Clima'),
                                    $('<div>').html(region.climate || 'No disponible'),
                                    $('<h4>').text('Suelo'),
                                    $('<div>').html(region.soil || 'No disponible'),
                                    $('<h4>').text('Uvas Principales'),
                                    $('<div>').html(region.grapes || 'No disponible')
                                ),
                                $('<div>', { class: 'col-md-8' }).append(
                                    $('<div>').html(region.description || 'Descripción no disponible'),
                                    $('<hr>'),
                                    $('<h4>').text('Productores destacados'),
                                    $('<div>', { class: 'productores-tags' }),
                                    $('<button>', {
                                        class: 'btn btn-primary ver-vinos mt-3',
                                        'data-region-id': regionId
                                    }).text('Ver vinos de esta región')
                                )
                            ),
                            buttons: [
                                { text: "Cerrar", close: true }
                            ],
                        });

                        dialog.opened().then(function () {
                            if (region.producers_ids && region.producers_ids.length > 0) {
                                rpc.query({
                                    model: 'res.partner',
                                    method: 'read',
                                    args: [region.producers_ids, ['name']],
                                }).then(function (productores) {
                                    productores.forEach(function (productor) {
                                        dialog.$content.find('.productores-tags').append(
                                            $('<span>', {
                                                class: 'badge badge-primary mr-2 mb-2'
                                            }).text(productor.name)
                                        );
                                    });
                                });
                            }
                        });

                        dialog.open();
                    }
                });
            },

            _onVerVinosClick: function (ev) {
                ev.preventDefault();
                var regionId = $(ev.currentTarget).data('region-id');
                this.do_action({
                    type: 'ir.actions.act_window',
                    name: 'Vinos de la región',
                    res_model: 'product.template',
                    views: [[false, 'list'], [false, 'form']],
                    domain: [['region_id', '=', regionId]],
                    target: 'current',
                });
            },
        });

        //registry.add('mapa_vinoysefue_widget', MapaVinoYSeFueWidget);
        if (!odoo.isWebsiteEditor) {
            registry.add('mapa_vinoysefue_widget', MapaVinoYSeFueWidget);
        }
        return MapaVinoYSeFueWidget;
    });
}
