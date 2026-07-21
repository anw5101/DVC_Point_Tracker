from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        response = page.goto('https://dvc-rental.com/resources/point-charts/saratoga-springs-resort-and-spa/2025', timeout=60000)
        print("Status:", response.status)
        text = page.locator("body").inner_text()
        with open("page_text.txt", "w") as f:
            f.write(text)
        browser.close()

try:
    run()
    print("Success")
except Exception as e:
    print(e)
