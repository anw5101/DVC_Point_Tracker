import requests
from bs4 import BeautifulSoup
import sys

url = "https://www.dvcresalemarket.com/point-chart/2025-old-key-west/"
headers = {'User-Agent': 'Mozilla/5.0'}
response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.text, 'html.parser')

tables = soup.find_all('table')
if not tables:
    print("No tables found")
    sys.exit(1)

for i, table in enumerate(tables):
    print(f"Table {i}:")
    for row in table.find_all('tr'):
        cols = row.find_all(['th', 'td'])
        cols = [ele.text.strip() for ele in cols]
        print([ele for ele in cols if ele])
    print("---")
