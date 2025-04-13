from odoo import models, fields, api

class WineRegion(models.Model):
    _name = 'wine.region'
    _description = 'Región Vitivinícola'
    _order = 'sequence, name'
    
    name = fields.Char('Nombre', required=True, translate=True)
    sequence = fields.Integer('Secuencia', default=10)
    country_id = fields.Many2one('res.country', 'País', required=True)
    description = fields.Html('Descripción', translate=True)
    image = fields.Binary('Imagen Representativa')
    geo_data = fields.Text('Datos Geográficos (GeoJSON)')
    color = fields.Char('Color', default='#3388ff')
    wine_ids = fields.One2many('wine.product', 'region_id', 'Vinos')
    producers_ids = fields.Many2many('wine.producer', string='Productores')
    climate = fields.Text('Clima', translate=True)
    soil = fields.Text('Suelo', translate=True)
    grapes = fields.Text('Uvas Principales', translate=True)
    
    def get_region_data(self):
        return {
            'id': self.id,
            'name': self.name,
            'country_id': self.country_id.id,
            'country_name': self.country_id.name,
            'geo_data': self.geo_data,
            'color': self.color,
            'image_url': '/web/image/wine.region/%s/image' % self.id,
        }

class WineRegionMap(models.Model):
    _name = 'wine.region.map'
    _description = 'Mapa de Regiones Vitivinícolas'
    
    name = fields.Char('Nombre del Mapa', required=True, translate=True)
    region_ids = fields.One2many('wine.region', 'map_id', string='Regiones')
    default_lat = fields.Float('Latitud por defecto', default=46.0)  # Centrado en Europa
    default_lng = fields.Float('Longitud por defecto', default=2.0)   # Centrado en Europa
    default_zoom = fields.Integer('Zoom por defecto', default=5)
    
    def get_map_config(self):
        return {
            'default_lat': self.default_lat,
            'default_lng': self.default_lng,
            'default_zoom': self.default_zoom,
            'regions': [region.get_region_data() for region in self.region_ids],
        }