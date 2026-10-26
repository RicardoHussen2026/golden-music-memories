"""Adaptador do painel; o núcleo recebido permanece sem alterações."""
import argparse
import json
import os
from pathlib import Path
from media_downloader import core
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
            if not re.fullmatch(r'[a-zA-Z0-9_-]{11}', video_id):
                raise ValueError('Use um video individual do YouTube.')
            return super().validate()
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
    parser.add_argument('--container', default='mkv')
    parser.add_argument('--mode', default='video')
    parser.add_argument('--no-subs', action='store_true')
    parser.add_argument('--max-bytes', default='8589934592')
    args = parser.parse_args()
    os.environ['PATH'] = os.pathsep.join([args.tools, str(Path(args.node).parent), os.environ.get('PATH', '')])
    if args.check:
        from importlib.metadata import version
        deps = core.dependencies()
        print(json.dumps({'ready': all(deps[k] for k in ('ffmpeg','ffprobe','yt_dlp')) and bool(deps['node'] or deps['deno']), 'engine': version('yt-dlp'), 'core': 'MediaDownloader 0.1.0'}))
        return
    if os.name == 'nt':
        args.output = '\\\\?\\' + str(Path(args.output).resolve()).removeprefix('\\\\?\\')
    original = core.command
    def bounded(req, target, deps=None):
        command = original(req, target, deps)
        end = command.index('--')
        command[end:end] = ['--write-info-json', '--max-filesize', args.max_bytes, '--progress-delta', '1', '--no-plugin-dirs', '--no-cache-dir', '--no-remote-components', '--no-cookies', '--no-cookies-from-browser']
        return command
    core.command = bounded
    def emit(event):
        if event.get('type') == 'complete':
            report = event['report']
            report['metadata'] = {}
            if report.get('files'):
                parent = Path(report['files'][0]['path']).parent
                for path in parent.glob('*.info.json'):
                    try:
                        info = json.loads(path.read_text(encoding='utf-8'))
                        report['metadata'] = {k: info.get(k) for k in ('id', 'title', 'track', 'artist', 'artists', 'album', 'release_year', 'upload_date', 'uploader', 'channel')}
                        break
                    except (OSError, ValueError):
                        pass
        print(json.dumps(event, ensure_ascii=False), flush=True)
    try:
        core.download(PanelRequest(args.url, args.output, args.container, args.mode, not args.no_subs), emit)
    except Exception as error:
        print(json.dumps({'type':'error', 'message':str(error)}, ensure_ascii=False), flush=True)
        raise SystemExit(1)

if __name__ == '__main__':
    main()
