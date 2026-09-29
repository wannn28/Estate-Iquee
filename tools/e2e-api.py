"""End-to-end check of Hollis Row against the real Go + MySQL API.
usage: python tools/e2e-api.py BASE_URL SHOT_PREFIX
Walks home -> search (server-side filters, facets, "show more", map) -> listing -> tour request ->
saved homes -> contact -> admin inbox, fails on any console error or failed /api request and writes
screenshots SHOT_PREFIX-*.png. Prints the id of the stored tour request."""
import sys, re, json
from playwright.sync_api import sync_playwright, expect

base = sys.argv[1].rstrip('/')
prefix = sys.argv[2]
errors, api_fail = [], []

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 1440, 'height': 900})
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and errors.append(m.text))
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('response', lambda r: '/api/' in r.url and r.status >= 400 and api_fail.append(f'{r.status} {r.url}'))

    # home
    pg.goto(base + '/')
    expect(pg.locator('section[aria-label="Featured homes"] article').first).to_be_visible(timeout=15000)
    print('home:', pg.locator('text=homes for sale and').first.inner_text())
    pg.wait_for_timeout(1200)
    pg.screenshot(path=f'{prefix}-home.png')

    # search with filters -> compare with the API directly
    q = 'type=House&min=1000000&sort=price-desc'
    pg.goto(f'{base}/search?{q}')
    expect(pg.locator('[data-testid=result-count]')).not_to_have_text('…', timeout=10000)
    shown = int(pg.locator('[data-testid=result-count]').inner_text())
    api = pg.request.get(f'{base}/api/listings?mode=buy&{q}').json()
    assert shown == api['total'], (shown, api['total'])
    prices = [i['price'] for i in api['items']]
    assert prices == sorted(prices, reverse=True)
    print('search House >=1M:', shown, 'homes; facets', api['facets']['types'])
    pg.locator('aside[aria-label=Filters]').get_by_label('Pool').check()
    pg.wait_for_url(re.compile('amenities=Pool'))
    pg.wait_for_timeout(700)
    pool = int(pg.locator('[data-testid=result-count]').inner_text())
    print('  + Pool:', pool)
    assert pool <= shown
    pg.wait_for_timeout(600)
    pg.evaluate('window.scrollTo(0, 0)')
    pg.wait_for_timeout(300)
    pg.screenshot(path=f'{prefix}-search.png')

    # pagination: 16 homes for sale, 12 per page
    pg.goto(base + '/search')
    expect(pg.locator('[data-testid=show-more]')).to_be_visible(timeout=10000)
    before = pg.locator('section[aria-label=Results] article').count()
    pg.locator('[data-testid=show-more]').click()
    expect(pg.locator('[data-testid=show-more]')).to_have_count(0, timeout=10000)
    after = pg.locator('section[aria-label=Results] article').count()
    print('show more:', before, '->', after)
    assert after > before

    # map view
    pg.goto(base + '/search?mode=rent&view=map')
    expect(pg.locator('.hr-marker').first).to_be_visible(timeout=15000)
    print('map markers:', pg.locator('.hr-marker').count())
    pg.wait_for_timeout(1500)
    pg.screenshot(path=f'{prefix}-map.png')

    # listing detail + tour request
    first = api['items'][0]
    pg.goto(f"{base}/listing/{first['slug']}")
    expect(pg.locator('h1')).to_have_text(first['title'], timeout=10000)
    expect(pg.get_by_role('heading', name=re.compile('Similar'))).to_be_visible()
    pg.get_by_role('button', name=re.compile(r'^Save\b')).first.click()
    form = pg.locator('[data-testid=tour-form]')
    form.scroll_into_view_if_needed()
    form.get_by_role('button', name='Request tour').click()
    expect(form.get_by_role('alert').first).to_be_visible()
    form.locator('input[name=date]').nth(1).check(force=True)
    pg.select_option('#tour-time', '3:00 PM')
    pg.fill('#tour-name', 'Playwright Check')
    pg.fill('#tour-email', 'qa@example.com')
    pg.fill('#tour-note', 'Automated end-to-end check of the tour form.')
    form.get_by_role('checkbox').check()
    with pg.expect_response(lambda r: r.url.endswith('/api/tour-requests')) as resp:
        form.get_by_role('button', name='Request tour').click()
    tour = resp.value.json()
    assert resp.value.status == 201, resp.value.status
    expect(pg.locator('[data-testid=tour-success]')).to_be_visible()
    print('tour request stored: id', tour['id'], tour['listingId'], tour['date'], tour['time'])
    pg.locator('[data-testid=tour-success]').scroll_into_view_if_needed()
    pg.wait_for_timeout(500)
    pg.screenshot(path=f'{prefix}-detail.png')

    # saved homes survive a reload (server-side, keyed by anonymous client id)
    pg.goto(base + '/saved')
    expect(pg.get_by_role('link', name=first['title']).first).to_be_visible(timeout=10000)
    cid = pg.evaluate("localStorage.getItem('hollisrow:client-id')")
    srv = pg.request.get(f'{base}/api/saved/{cid}').json()
    assert first['id'] in srv['ids'], srv['ids']
    print('saved on server for', cid[:8], '->', srv['ids'])
    pg.screenshot(path=f'{prefix}-saved.png')

    # contact message
    pg.goto(base + '/contact?topic=buying')
    pg.fill('#c-name', 'Playwright Check')
    pg.fill('#c-email', 'qa@example.com')
    pg.fill('#c-msg', 'Automated end-to-end check of the contact form, please ignore.')
    with pg.expect_response(lambda r: r.url.endswith('/api/contact-messages')) as cresp:
        pg.get_by_role('button', name='Send message').click()
    assert cresp.value.status == 201, cresp.value.status
    expect(pg.get_by_role('status')).to_contain_text('saved to the Hollis Row database')
    print('contact message stored: id', cresp.value.json()['id'])

    # admin inbox
    pg.goto(base + '/admin')
    pg.get_by_role('button', name=re.compile('Sign in')).click()
    expect(pg.locator('[data-testid=admin-tours] tbody tr').first).to_be_visible(timeout=10000)
    assert pg.locator('[data-testid=admin-tours]').inner_text().count(first['title']) >= 1
    pg.wait_for_timeout(400)
    pg.screenshot(path=f'{prefix}-admin.png')

    # clean up the shortlist so repeated runs start empty
    pg.request.delete(f'{base}/api/saved/{cid}')

    # mobile
    m = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, device_scale_factor=2).new_page()
    m.on('console', lambda x: x.type == 'error' and errors.append('mobile: ' + x.text))
    m.goto(base + '/search?mode=rent')
    expect(m.locator('section[aria-label=Results] article').first).to_be_visible(timeout=10000)
    m.wait_for_timeout(1000)
    m.screenshot(path=f'{prefix}-mobile.png')

    b.close()

print('console errors:', len(errors), errors[:5])
print('failed api calls (400 on the intentional empty submit excluded):', [f for f in api_fail if not (f.startswith('422') and 'tour-requests' in f)])
ok = not errors and not [f for f in api_fail if not (f.startswith('422') and 'tour-requests' in f)]
print('RESULT', 'PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
