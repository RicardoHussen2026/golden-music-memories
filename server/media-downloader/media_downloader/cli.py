import argparse
import json
from threading import Event
from .core import DownloadRequest, download, Cancelled

def main():
    parser = argparse.ArgumentParser(description="Download sem recompressão; eventos JSON por linha")
    parser.add_argument('url')
    parser.add_argument('--output', default='downloads')
    parser.add_argument('--container', choices=['mp4', 'mkv'], default='mkv')
    parser.add_argument('--mode', choices=['video', 'audio'], default='video')
    parser.add_argument('--no-subs', action='store_true')
    args = parser.parse_args()
    try:
        download(DownloadRequest(args.url, args.output, args.container, args.mode, not args.no_subs),
                 lambda e: print(json.dumps(e, ensure_ascii=False), flush=True))
    except (Exception, KeyboardInterrupt) as exc:
        print(json.dumps({'type': 'error', 'message': str(exc)}, ensure_ascii=False), flush=True)
        raise SystemExit(1)

if __name__ == '__main__':
    main()
