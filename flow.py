import sys
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:4391'
ok = lambda c, m: print(('PASS ' if c else 'FAIL ') + m)
with sync_playwright() as p:
    br = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = br.new_page(viewport={'width': 1280, 'height': 860}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE + '/search')
    n0 = int(pg.text_content('[data-testid=result-count]'))
    pg.click('label:has-text("3+") >> nth=0'); pg.check('input[type=checkbox] >> nth=5')  # first amenity after 5 types = Pool
    n1 = int(pg.text_content('[data-testid=result-count]')); ok(n1 < n0 and 'beds=3' in pg.url and 'amenities=Pool' in pg.url, f'filters narrow {n0}->{n1}, URL synced')
    pg.click('label:has-text("Rent") >> nth=0'); ok('mode=rent' in pg.url, 'rent toggle')
    pg.goto(BASE + '/search?sort=price-asc'); prices = pg.eval_on_selector_all('article p.text-lg', 'e=>e.map(x=>+x.textContent.replace(/[^0-9]/g,""))'); ok(prices == sorted(prices), 'sort price asc')
    pg.click('button[aria-label^="Save "] >> nth=0'); pg.reload(); ok(pg.locator('button[aria-pressed=true]').count() == 1, 'favorite persists after reload')
    pg.goto(BASE + '/listing/lamplight-craftsman-hyde-park')
    pg.click('text=Request tour'); ok(pg.locator('[role=alert]').count() == 1, 'tour validation errors shown')
    pg.click('input[name=date] >> nth=1', force=True); pg.select_option('#tour-time', '10:30 AM')
    pg.fill('#tour-name', 'Jane Doe'); pg.fill('#tour-email', 'bad'); pg.click('text=Request tour'); ok(pg.locator('#tour-email-err').count() == 1, 'email validation')
    pg.fill('#tour-email', 'jane@example.com'); pg.check('text=I understand this is a demo'); pg.click('text=Request tour')
    ok(pg.locator('[data-testid=tour-success]').count() == 1, 'tour success state')
    pg.click('[data-testid=open-lightbox]'); pg.keyboard.press('ArrowRight'); ok('2 /' in pg.text_content('[role=dialog]'), 'lightbox arrow nav'); pg.keyboard.press('Escape'); ok(pg.locator('[role=dialog]').count() == 0, 'lightbox esc')
    m1 = pg.text_content('[data-testid=monthly]'); pg.click('label:has-text("15 yr")'); m2 = pg.text_content('[data-testid=monthly]'); ok(m1 != m2, f'calculator updates {m1} -> {m2}')
    pg.goto(BASE + '/contact'); pg.click('text=Send message'); ok(pg.locator('#c-name-err').count() == 1, 'contact validation')
    pg.fill('#c-name', 'Jane'); pg.fill('#c-email', 'jane@example.com'); pg.fill('#c-msg', 'Looking for a 3 bed in Hyde Park'); pg.click('text=Send message'); ok(pg.locator('text=Thanks, Jane').count() == 1, 'contact success')
    pg.goto(BASE + '/listing/nope'); ok(pg.locator('text=isn’t on our books').count() == 1, '404 for unknown listing')
    ok(not errs, f'no page errors {errs}')
    br.close()
