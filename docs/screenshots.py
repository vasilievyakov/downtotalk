"""Capture screenshots for README using Playwright."""

import asyncio
from playwright.async_api import async_playwright


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # Screenshot 1: Desktop landing
        page = await browser.new_page(viewport={"width": 1280, "height": 900})
        await page.goto("https://downtotalk.vercel.app", wait_until="networkidle")
        await page.screenshot(path="/Users/vasiliev/downtotalk/docs/landing.png")
        print("done: landing.png")

        # Screenshot 3: Status widget — find the card container
        # Look for the parent container that holds the entire status card
        selectors = [
            'div:has(> :text("LIVE AI STATUS"))',  # parent of the heading
            'section:has(:text("LIVE AI STATUS"))',
            '[class*="status"]',
            '[class*="card"]:has(:text("Claude"))',
        ]
        element = None
        for sel in selectors:
            try:
                # Get all matches and pick the one with reasonable size
                els = page.locator(sel)
                count = await els.count()
                for i in range(count):
                    el = els.nth(i)
                    box = await el.bounding_box()
                    if box and box["width"] > 300 and box["height"] > 150:
                        element = el
                        print(
                            f"  Found status widget: {sel} (index {i}, {box['width']:.0f}x{box['height']:.0f})"
                        )
                        break
                if element:
                    break
            except Exception as e:
                print(f"  Selector {sel} failed: {e}")
                continue

        if element:
            await element.screenshot(
                path="/Users/vasiliev/downtotalk/docs/status-widget.png"
            )
            print("done: status-widget.png (element)")
        else:
            # Fallback: use JS to find the status card and clip it
            print("  Trying JS fallback to find status card...")
            box = await page.evaluate("""() => {
                const el = document.querySelector('[class*="status"]')
                    || [...document.querySelectorAll('div')].find(d => d.textContent.includes('LIVE AI STATUS') && d.offsetHeight > 150 && d.offsetWidth > 300);
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                return {x: rect.x, y: rect.y, width: rect.width, height: rect.height};
            }""")
            if box:
                await page.screenshot(
                    path="/Users/vasiliev/downtotalk/docs/status-widget.png",
                    clip=box,
                )
                print(
                    f"done: status-widget.png (JS clip {box['width']:.0f}x{box['height']:.0f})"
                )
            else:
                print("  Could not find status widget, taking full page")
                await page.screenshot(
                    path="/Users/vasiliev/downtotalk/docs/status-widget.png",
                    full_page=True,
                )

        await page.close()

        # Screenshot 2: Mobile landing
        page = await browser.new_page(viewport={"width": 390, "height": 844})
        await page.goto("https://downtotalk.vercel.app", wait_until="networkidle")
        await page.screenshot(path="/Users/vasiliev/downtotalk/docs/landing-mobile.png")
        print("done: landing-mobile.png")

        await page.close()
        await browser.close()


asyncio.run(main())
