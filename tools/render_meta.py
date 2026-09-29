from playwright.sync_api import sync_playwright
from PIL import Image
R='/workspace/demo-realestate'
with sync_playwright() as p:
    br = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--allow-file-access-from-files'])
    pg = br.new_page(viewport={'width': 1200, 'height': 630})
    pg.goto(f'file://{R}/tools/og.html'); pg.evaluate('document.fonts.ready.then(()=>1)'); pg.wait_for_timeout(1000)
    pg.screenshot(path='/tmp/re-og.png')
    for s, name in [(180, 'apple-touch-icon.png'), (32, 'favicon-32.png'), (512, 'icon-512.png')]:
        q = br.new_page(viewport={'width': s, 'height': s})
        open(f'{R}/tools/_icon.html','w').write(f'<body style="margin:0"><img src="../public/favicon.svg" width="{s}" height="{s}" style="display:block"></body>'); q.goto(f'file://{R}/tools/_icon.html')
        q.wait_for_timeout(300); q.screenshot(path=f'{R}/public/{name}'); q.close()
    br.close()
Image.open('/tmp/re-og.png').convert('RGB').save(f'{R}/public/og-image.jpg', quality=86)
print('ok')
