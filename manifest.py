{
    'name': 'Mapa Vino y Se Fue',
    'version': '1.0',
    'summary': 'Mapa interactivo de regiones vinícolas',
    'description': """
        Módulo que muestra un mapa interactivo de regiones vinícolas
        similar al de Kermit Lynch, con información detallada de cada zona.
    """,
    'author': 'Salvador Jiménez Sánchez',
    'website': 'https://tusitio.com',
    'category': 'Vino',
    'depends': ['base', 'web', 'website'],
    'data': [
        'security/ir.model.access.csv',
        'views/menu_views.xml',
        'views/region_views.xml',
        'views/mapa_views.xml',
        'views/mapa_templates.xml',
        'static/xml/views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'mapa_vinoysefue/static/lib/leaflet/leaflet.js',
            'mapa_vinoysefue/static/lib/leaflet/leaflet.css',
            'mapa_vinoysefue/static/src/js/mapa_widget.js',
            'mapa_vinoysefue/static/src/scss/mapa_estilos.scss',
        ],
        'website.assets_wysiwyg': [
            'mapa_vinoysefue/static/src/js/mapa_widget.js',
        ],
        'web.assets_qweb': [
            'mapa_vinoysefue/static/xml/views.xml',
        ],
    },
    'demo': [],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}