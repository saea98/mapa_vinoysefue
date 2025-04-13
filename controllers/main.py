from odoo import http
from odoo.http import request

class MapaVinoYSeFueController(http.Controller):
    
    @http.route('/mapa_vinoysefue', type='http', auth="public", website=True)
    def show_public_map(self, **kwargs):
        mapa = request.env['mapa.vinoysefue'].sudo().search(
            [('website_published', '=', True)], limit=1)
        if not mapa:
            return request.not_found()
        
        return request.render('mapa_vinoysefue.public_mapa_template', {
            'mapa': mapa,
        })
    
    @http.route('/mapa_vinoysefue/region_data', type='json', auth="public")
    def get_region_data(self, region_id, **kwargs):
        region = request.env['mapa.region'].sudo().browse(int(region_id))
        if not region.exists():
            return {'error': 'Región no encontrada'}
        
        return {
            'name': region.name,
            'description': region.description,
            'climate': region.climate,
            'soil': region.soil,
            'grapes': region.grapes,
            'image_url': '/web/image/mapa.region/%s/image' % region.id,
            'producers': [{
                'name': producer.name,
                'id': producer.id
            } for producer in region.producers_ids],
        }