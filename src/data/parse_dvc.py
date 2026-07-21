import urllib.request
import re
import json

req = urllib.request.Request('https://dvc-rental.com/resources/point-charts/saratoga-springs-resort-and-spa/2025', headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')

# Next.js app, look for __NEXT_DATA__ or next_f
m = re.search(r'self\.__next_f\.push\(\[1,"([^"]+)"\]\)', html)
if m:
    pass
# Actually, the data might be hardcoded as text in the HTML.
from bs4 import BeautifulSoup
soup = BeautifulSoup(html, 'html.parser')
for th in soup.find_all('th'):
    print(th.text)
for td in soup.find_all('td'):
    print(td.text)

