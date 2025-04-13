from odoo import models, fields, api

class RegionVinicola(models.Model):
    _name = 'mapa.region'
    _description = 'Región Vinícola'
    _order = 'sequence, name'
    
    name = fields.Char('Nombre', required=True, translate=True)
    sequence = fields.Integer('Secuencia', default=10)
    country_id = fields.Many2one('res.country', 'País', required=True)
    description = fields.Html('Descripción', translate=True)
    image = fields.Binary('Imagen Representativa')
    geo_data = fields.Text('Datos Geográficos (GeoJSON)')
    color = fields.Char('Color', default='#7a2518')  # Color vino tinto por defecto
    wine_ids = fields.One2many('product.template', 'region_id', 'Vinos')
    producers_ids = fields.Many2many('res.partner', string='Productores',
                                   domain=[('is_company', '=', True)])
    climate = fields.Text('Clima', translate=True)
    soil = fields.Text('Suelo', translate=True)
    grapes = fields.Text('Uvas Principales', translate=True)
    map_id = fields.Many2one('mapa.vinoysefue', 'Mapa')
    wine_ids = fields.One2many('product.template', 'region_id', 'Vinos')
    def get_region_data(self):
        return {
            'id': self.id,
            'name': self.name,
            'country_id': self.country_id.id,
            'country_name': self.country_id.name,
            'geo_data': self.geo_data,
            'color': self.color,
            'image_url': '/web/image/mapa.region/%s/image' % self.id,
        }

class MapaVinoYSeFue(models.Model):
    _name = 'mapa.vinoysefue'
    _description = 'Mapa Vino y Se Fue'
    
    name = fields.Char('Nombre del Mapa', required=True, translate=True)
    region_ids = fields.One2many('mapa.region', 'map_id', string='Regiones')
    default_lat = fields.Float('Latitud por defecto', default=46.0)
    default_lng = fields.Float('Longitud por defecto', default=2.0)
    default_zoom = fields.Integer('Zoom por defecto', default=5)
    website_published = fields.Boolean('Publicado en Web', default=False)
    
    def get_map_config(self):
        return {
            'default_lat': self.default_lat,
            'default_lng': self.default_lng,
            'default_zoom': self.default_zoom,
            'regions': [region.get_region_data() for region in self.region_ids],
        }
    def open_map_view(self):
        """Método para abrir la vista del mapa"""
        return {
            'type': 'ir.actions.act_window',
            'name': 'Mapa Interactivo',
            'res_model': 'mapa.vinoysefue',
            'view_mode': 'form',
            'res_id': self.id,
            'target': 'current',
            'views': [(False, 'form')],
        }

class ProductTemplate(models.Model):
    _inherit = 'product.template'
    
    region_id = fields.Many2one('mapa.region', 'Región Vinícola',
                              domain="[('website_published', '=', True)]")