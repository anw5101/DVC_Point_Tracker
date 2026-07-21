import urllib.request
import pypdf
import io
import json

req = urllib.request.Request(
    'https://www.dvcresalemarket.com/wp-content/uploads/2023/12/2025-Vero-Beach.pdf',
    headers={'User-Agent': 'Mozilla/5.0'}
)
try:
    pdf_bytes = urllib.request.urlopen(req).read()
    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    for page in reader.pages:
        print(page.extract_text())
except Exception as e:
    print("Error:", e)
