#!/usr/bin/env python3
"""One-off ROPS snapshot. Requires beautifulsoup4 and pdftotext; never run at request time."""
import concurrent.futures, datetime, hashlib, json, pathlib, re, subprocess, urllib.parse, urllib.request
from bs4 import BeautifulSoup

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/rops'
BASE = 'https://rops.krakow.pl'
LIBRARY = BASE + '/innowacje-spoleczne/biblioteka-innowacji-spolecznych/kategorie'
MAP = BASE + '/mpliki/IS/IWS_20/za._nr_2._Mapa_Wyzwa_Spoecznych.pdf'

def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (ROPS library archival research)'})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()

def absolute(url):
    return urllib.parse.urljoin(BASE, url).replace('http://rops.krakow.pl', BASE)

def text(node):
    return re.sub(r'[ \t]+', ' ', node.get_text(' ', strip=True)).strip()

def category(info):
    url, name = info
    soup = BeautifulSoup(fetch(url), 'html.parser')
    return [(absolute(a['href']), text(a), name) for a in soup.select('.news-list__title')]

def entry(info):
    url, title, category_names = info
    soup = BeautifulSoup(fetch(url), 'html.parser')
    content = soup.select_one('.content__main .text-content')
    links = list(dict.fromkeys(absolute(a['href']) for a in content.select('a[href]')))
    # Navigation/icon tables add no evidence; only retain explanatory paragraphs/headings.
    for table in content.select('table'):
        table.decompose()
    description = '\n'.join(text(n) for n in content.find_all(['h3', 'h4', 'p']) if text(n))
    return {'id': url.rsplit(',', 1)[-1], 'title': title, 'url': url,
            'categories': category_names, 'description': description,
            'pdfs': [{'url': u} for u in links if urllib.parse.urlparse(u).path.lower().endswith('.pdf')],
            'videos': [u for u in links if 'youtube.com/watch' in u or 'youtu.be/' in u],
            'materials': [u for u in links if urllib.parse.urlparse(u).path.lower().endswith(('.zip', '.doc', '.docx'))],
            'licenses': [u for u in links if 'creativecommons.org' in u]}

def document(url):
    name = hashlib.sha256(url.encode()).hexdigest()[:12] + '-' + urllib.parse.unquote(url.rsplit('/', 1)[-1])
    path = OUT / 'pdfs' / name
    try:
        if not path.exists():
            data = fetch(urllib.parse.quote(url, safe=':/?=&%'))
            if not data.startswith(b'%PDF'):
                raise ValueError('Source returned non-PDF content')
            path.write_bytes(data)
        result = subprocess.run(['pdftotext', '-layout', str(path), '-'], capture_output=True, check=True)
        extracted = result.stdout.decode('utf-8').replace('\x00', '').strip()
        return {'url': url, 'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                'bytes': path.stat().st_size, 'text': extracted, 'pages': [{'page': i + 1, 'text': page.strip()} for i, page in enumerate(extracted.split('\f')) if page.strip()], 'status': 'downloaded'}
    except Exception as error:
        return {'url': url, 'status': 'unavailable', 'error': str(error)}

def main():
    OUT.joinpath('pdfs').mkdir(parents=True, exist_ok=True)
    soup = BeautifulSoup(fetch(LIBRARY), 'html.parser')
    categories = {}
    for a in soup.select('.side-menu__subsubnav-link'):
        if '/biblioteka-innowacji-spolecznych/dla-' in a.get('href', ''):
            categories[absolute(a['href'])] = text(a)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        rows = [item for result in pool.map(category, categories.items()) for item in result]
        entries = {}
        for url, title, cat in rows:
            key = url.rsplit(',', 1)[-1]
            if key not in entries:
                entries[key] = [url, title, []]
            if cat not in entries[key][2]: entries[key][2].append(cat)
        projects = list(pool.map(entry, entries.values()))
        print(f'{len(categories)} categories; {len(rows)} category entries; {len(projects)} unique projects', flush=True)
        urls = sorted(set([MAP] + [d['url'] for p in projects for d in p['pdfs']]))
        documents = dict(zip(urls, pool.map(document, urls)))
    for project in projects:
        project['pdfs'] = [documents[d['url']] for d in project['pdfs']]
    payload = {'sourceUrl': LIBRARY, 'snapshotAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
               'categories': [{'title': title, 'url': url} for url, title in categories.items()],
               'challengeMap': documents[MAP], 'projects': projects}
    OUT.joinpath('catalog.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
    print(f'{len(urls)} PDFs; {sum(d["status"] == "downloaded" for d in documents.values())} downloaded; catalog {OUT.joinpath("catalog.json").stat().st_size} bytes', flush=True)
    for d in documents.values():
        if d['status'] != 'downloaded': print(d, flush=True)

if __name__ == '__main__': main()
