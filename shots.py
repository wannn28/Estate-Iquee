import sys
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:4391'
OUT = '/workspace/demo-realestate/'
def settle(pg, full=True):
    H = pg.evaluate('document.documentElement.scrollHeight'); vh = pg.viewport_size['height']
    if full:
        for y in range(0, H + vh, vh // 2):
            pg.evaluate(f'window.scrollTo(0,{y})'); pg.wait_for_timeout(60)
    pg.evaluate('Promise.race([new Promise(r=>setTimeout(r,5000)),Promise.all([...document.images].filter(i=>i.offsetParent).map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r})))])')
    pg.evaluate('document.fonts.ready.then(()=>1)'); pg.evaluate('window.scrollTo(0,0)'); pg.wait_for_timeout(900)
    return pg.evaluate('[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)')
def tiles(pg):
    pg.wait_for_timeout(1500)
    pg.evaluate('Promise.race([new Promise(r=>setTimeout(r,8000)),Promise.all([...document.querySelectorAll(".leaflet-tile")].map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r})))])')
    pg.wait_for_timeout(600)
    return pg.evaluate('[...document.querySelectorAll(".leaflet-tile")].filter(i=>i.complete&&i.naturalWidth).length')
with sync_playwright() as p:
    br = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = br.new_context(viewport={'width': 1440, 'height': 900})
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    pg.goto(BASE + '/'); print('home broken', settle(pg))
    # save two homes so hearts show state
    pg.evaluate("localStorage.setItem('hollisrow:saved:v1', JSON.stringify(['HR-2401','HR-2403','HR-2406']))"); pg.reload(); settle(pg)
    pg.screenshot(path=OUT + 'shot-home.png', full_page=True)
    pg.goto(BASE + '/search'); print('search broken', settle(pg)); pg.screenshot(path=OUT + 'shot-search-grid.png', full_page=True)
    pg.goto(BASE + '/search?view=list&beds=3&amenities=Private+yard'); settle(pg); pg.screenshot(path=OUT + 'shot-search-list.png', full_page=False)
    pg.goto(BASE + '/search?view=map'); settle(pg, False); print('tiles', tiles(pg))
    pg.locator('article').nth(2).hover(); pg.wait_for_timeout(400)
    pg.screenshot(path=OUT + 'shot-search-map.png')
    pg.goto(BASE + '/listing/ledge-house-barton-hills'); print('detail broken', settle(pg)); print('tiles', tiles(pg))
    pg.screenshot(path=OUT + 'shot-detail.png', full_page=True)
    pg.click('[data-testid=open-lightbox]'); pg.wait_for_timeout(300); pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(1200)
    pg.screenshot(path=OUT + 'shot-lightbox.png'); pg.keyboard.press('Escape')
    pg.locator('[data-testid=mortgage]').scroll_into_view_if_needed(); pg.wait_for_timeout(300)
    pg.locator('[data-testid=mortgage]').screenshot(path=OUT + 'shot-calculator.png')
    # tour form validation
    pg.click('text=Request tour'); pg.wait_for_timeout(300)
    pg.locator('#tour').screenshot(path=OUT + 'shot-tour-errors.png')
    pg.goto(BASE + '/saved'); settle(pg); pg.wait_for_timeout(1500); pg.screenshot(path=OUT + 'shot-saved.png', full_page=True)
    pg.goto(BASE + '/agents'); settle(pg); pg.screenshot(path=OUT + 'shot-agents.png', full_page=True)
    pg.goto(BASE + '/contact'); settle(pg, False); tiles(pg); pg.screenshot(path=OUT + 'shot-contact.png', full_page=True)
    m = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2)
    mp = m.new_page(); mp.on('pageerror', lambda e: errs.append(str(e)))
    mp.goto(BASE + '/'); print('mobile broken', settle(mp)); mp.screenshot(path=OUT + 'shot-mobile-home.png', full_page=True)
    print('mobile home scrollWidth', mp.evaluate('document.documentElement.scrollWidth'))
    mp.goto(BASE + '/search'); settle(mp); mp.screenshot(path=OUT + 'shot-mobile-search.png', full_page=False)
    print('mobile search scrollWidth', mp.evaluate('document.documentElement.scrollWidth'))
    mp.click('text=Filters'); mp.wait_for_timeout(400); mp.screenshot(path=OUT + 'shot-mobile-filters.png')
    mp.goto(BASE + '/listing/cedar-modern-zilker'); settle(mp); mp.screenshot(path=OUT + 'shot-mobile-detail.png', full_page=True)
    print('mobile detail scrollWidth', mp.evaluate('document.documentElement.scrollWidth'))
    print('errors', errs)
    br.close()
