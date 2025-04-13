{
    'name': 'Mapa Vino y Se Fue',
    'version': '1.0',
    'summary': 'Mapa interactivo de regiones vinícolas',
    'description': """
        Módulo que muestra un mapa interactivo de regiones vinícolas
        Vinoysefue, con información detallada de cada zona.
    """,
    'author': 'Salvador Jiménez Sánchez',
    'website': 'https://github.com/saea98/mapa_vinoysefue',
    'category': 'Vino',
    'depends': ['base', 'web', 'website', 'product'],
    'data': [
        'security/ir.model.access.csv',
        'views/region_views.xml',
        'views/mapa_views.xml',
        'views/mapa_templates.xml',
        'views/menu_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'mapa_vinoysefue/static/src/js/mapa_widget.js',
            'mapa_vinoysefue/static/src/scss/mapa_estilos.scss',
        ],
        'website.assets_wysiwyg': [
            'mapa_vinoysefue/static/src/js/mapa_widget.js',
        ],
    },
    'demo': [],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}