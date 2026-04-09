#!/bin/bash
# Run this periodically until all transcripts are downloaded
# YouTube blocks IPs temporarily - this script retries with long delays

cd /Users/server/elite_platform

python3 << 'PYEOF'
import urllib.request, re, html as html_mod, time, os

outdir = '/Users/server/elite_platform/data/transcripts'
os.makedirs(outdir, exist_ok=True)

videos = [
    "cX2_1D35bR8", "MIR0M95H3u4", "4our1Sasjxc", "7KNdTc3WSR8", "q_53ruQKXsc",
    "nIQ5EPb8Y1M", "3hHzSLyQhO4", "6qHTzSwTX-8", "nYZyiFBslmg", "ovck9n_yBmw",
    "EVC0-b8zqPU", "1Lc8lTFfZfM", "Hb-s8WkI3dQ", "VjYhx9D8Q1s", "6NWQh4OUkCA",
    "kE0_Bq_Om-Q", "CB6CSpei2uA", "BpMT6MkByeE", "EVLL9R0jRlI", "RAt6LapX-Z4",
    "UDSDO9FLjME", "YcagNr78Pis", "g2TwAOFOrGE", "3qEWI2f7iEg", "Zn30TDSdKQs",
    "tLRXvcq7nDQ", "pE6V0zwvX48", "N4wVzt3BRoA", "pa7FR68zxH0", "yKzwV_-kmjo",
    "jKFh2FvMlLY", "m7KVprO5pX0", "dvXSqPGnpnE", "AZFBsC7RWcc",
    "9XER-vUeEvo", "8FCGGtdglrc", "MXuQmpHfmfY", "lavTV2PR298", "9i6jWMqBWFc",
    "toS2UzxqmEs", "xnXauHrA3JQ", "OUHJi2JPdng", "Uz-Hpu4UEk8", "0711iBp0Xzc",
    "j1-HsMaZOlc", "BPDSg6DcKSo", "Yg2iQ3Rqn0w", "BnhpKB0F2e4", "WhGsApPkhiI",
    "GhHK8l5EkkA", "7HGINiJHrt8", "HA0gEb_E0-k", "LkcxGG3-u64", "rt_pb7feO50",
    "Gpz_TpMLu2I", "0yfbo0Zk0ms", "pnA8YScNbMQ"
]

ok = 0
fail = 0

for vid in videos:
    outfile = os.path.join(outdir, f'{vid}.txt')
    if os.path.exists(outfile) and os.path.getsize(outfile) > 100:
        ok += 1
        continue

    try:
        url = f'https://www.youtube.com/watch?v={vid}'
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Cookie': 'CONSENT=PENDING+987'
        }
        req = urllib.request.Request(url, headers=headers)
        resp = urllib.request.urlopen(req, timeout=15)
        page = resp.read().decode()

        match = re.search(r'"captionTracks":\[.*?"baseUrl":"([^"]+)"', page)
        if not match:
            fail += 1
            continue

        cap_url = match.group(1).replace('\\u0026', '&')
        if cap_url.startswith('/'):
            cap_url = 'https://www.youtube.com' + cap_url

        time.sleep(10)

        req2 = urllib.request.Request(cap_url, headers=headers)
        resp2 = urllib.request.urlopen(req2, timeout=15)
        data = resp2.read().decode()
        texts = re.findall(r'<text[^>]*>(.*?)</text>', data)
        clean = [html_mod.unescape(t) for t in texts]
        full_text = '\n'.join(clean)

        with open(outfile, 'w') as f:
            f.write(full_text)

        print(f'OK {vid} ({len(full_text)} chars)')
        ok += 1
        time.sleep(15)

    except Exception as e:
        err = str(e)[:40]
        if '429' in err:
            print(f'RATE LIMITED at video {vid} after {ok} OK. Stopping.')
            break
        fail += 1
        time.sleep(10)

print(f'Done: {ok} OK, {fail} failed, {len(videos) - ok - fail} remaining')
PYEOF
