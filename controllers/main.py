from odoo import http
from odoo.http import request

class MapController(http.Controller):
    
    @http.route('/interactive_map', type='http', auth="public", website=True)
    def show_public_map(self, **kwargs):
        map_data = request.env['custom.map'].sudo().search([], limit=1)
        if not map_data:
            return request.not_found()
        
        zones = map_data.zones_ids.sudo().search([])
        return request.render('custom_interactive_map.public_map_template', {
            'map': map_data,
            'zones': zones,
        })
    
    @http.route('/map/zone_data', type='json', auth="public")
    def get_zone_data(self, zone_id, **kwargs):
        zone = request.env['custom.map.zone'].sudo().browse(int(zone_id))
        if not zone.exists():
            return {'error': 'Zone not found'}
        
        return {
            'name': zone.name,
            'technical_data': zone.technical_data,
            'documents': [
                {
                    'name': doc.name,
                    'url': '/web/content/%s/%s' % (doc.id, doc.name)
                } for doc in zone.related_document_ids
            ]
        }