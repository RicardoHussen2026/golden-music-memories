"""JSON-lines bridge for the official yt-dlp Python API."""
import argparse
import json
import os
from pathlib import Path
from media_downloader import core
import engine
from urllib.parse import urlparse, parse_qs
import re

SOURCES = json.loads(Path(__file__).with_name('sources.json').read_text(encoding='utf-8'))

class PanelRequest(core.DownloadRequest):
    def validate(self):
        p = urlparse(self.url.strip())
        source = next((s for s in SOURCES if p.hostname in s['hosts']), None)
        if p.scheme != 'https' or p.username or p.password or p.port not in (None, 443) or not source:
            raise ValueError('Use HTTPS de uma fonte compativel.')
        if source.get('youtube'):
            video_id = p.path[1:] if p.hostname == 'youtu.be' else parse_qs(p.query).get('v', [''])[0] if p.path == '/watch' else p.path.split('/')[2] if re.match(r'^/(shorts|embed)/', p.path) else ''
            playlist = p.path == '/playlist' and re.fullmatch(r'[a-zA-Z0-9_-]{3,150}', parse_qs(p.query).get('list', [''])[0])
            if not playlist and not re.fullmatch(r'[a-zA-Z0-9_-]{11}', video_id):
                raise ValueError('Use um vídeo ou uma playlist do YouTube.')
            if self.container not in {'mp4', 'mkv'} or self.mode not in {'video', 'audio'} or not self.output.strip():
                raise ValueError('Formato, modo ou destino inválido.')
            return
        if not re.fullmatch(source['path'], p.path):
            raise ValueError('Use o link direto de um video individual.')
        if source.get('watchQuery') and re.fullmatch('/watch/?', p.path) and not re.fullmatch(r'\d+', parse_qs(p.query).get('v', [''])[0]):
            raise ValueError('Use o link direto do video do Facebook.')
        if self.container not in {'mp4', 'mkv'} or self.mode not in {'video', 'audio'} or not self.output.strip():
            raise ValueError('Formato, modo ou destino invalido.')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--tools', required=True)
    parser.add_argument('--node', required=True)
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--url')
    parser.add_argument('--output')
    parser.add_argument('--container', default='mp4')
    parser.add_argument('--archive')
    parser.add_argument('--expand', action='store_true')
    parser.add_argument('--mode', default='video')
    parser.add_argument('--no-subs', action='store_true')
    parser.add_argument('--max-bytes', default='8589934592')
    parser.add_argument('--max-height', type=int, choices=[720,1080])
    args = parser.parse_args()
    os.environ['PATH'] = os.pathsep.join([args.tools, str(Path(args.node).parent), os.environ.get('PATH', '')])
    if args.check:
        from importlib.metadata import version
        deps = core.dependencies()
        print(json.dumps({'ready': all(deps[k] for k in ('ffmpeg','ffprobe','yt_dlp')) and bool(deps['node'] or deps['deno']), 'engine': version('yt-dlp'), 'core': 'YoutubeDL Python API', 'api': True}))
        return
    if os.name == 'nt':
        args.output = '\\\\?\\' + str(Path(args.output).resolve()).removeprefix('\\\\?\\')
        if args.archive:
            args.archive = '\\\\?\\' + str(Path(args.archive).resolve()).removeprefix('\\\\?\\')
    def emit(event):
        print(json.dumps(event, ensure_ascii=False), flush=True)
    req = PanelRequest(args.url, args.output, args.container, args.mode, not args.no_subs)
    def task(send):
        if args.expand:
            engine.expand_playlist(req, args.tools, args.node, send)
        else:
            engine.download(req, args.tools, args.node, args.archive, send, int(args.max_bytes), max_height=args.max_height)
    if not engine.threaded(task, emit):
        raise SystemExit(1)

if __name__ == '__main__':
    main()
