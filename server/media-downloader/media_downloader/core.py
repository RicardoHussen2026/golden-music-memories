"""Núcleo sem dependência da interface; eventos serializáveis para integração."""
from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from threading import Event
import importlib.util
import json
import os
import queue
import shutil
import signal
import subprocess
import sys
import threading
import re

class Cancelled(Exception):
    pass

@dataclass(frozen=True)
class DownloadRequest:
    url: str
    output: str
    container: str = "mkv"
    mode: str = "video"
    subtitles: bool = True

    def validate(self):
        p = urlparse(self.url.strip())
        if p.scheme != "https" or p.username or p.password or p.port not in (None, 443):
            raise ValueError("Use um link HTTPS do YouTube ou YouTube Music.")
        if p.hostname not in {"youtube.com", "www.youtube.com", "music.youtube.com", "m.youtube.com", "youtu.be"}:
            raise ValueError("Domínio não permitido. Cole um link do YouTube.")
        if p.hostname == "youtu.be":
            valid = bool(p.path.strip('/'))
        else:
            valid = (p.path == '/watch' and bool(parse_qs(p.query).get('v'))) or p.path.startswith(('/shorts/', '/embed/'))
        if not valid:
            raise ValueError("Cole o link de um vídeo ou faixa, não de uma playlist/canal.")
        if self.container not in {"mp4", "mkv"} or self.mode not in {"video", "audio"}:
            raise ValueError("Formato ou modo inválido.")
        if not self.output.strip():
            raise ValueError("Selecione a pasta de destino.")


def dependencies():
    result = {name: shutil.which(name) for name in ('ffmpeg', 'ffprobe', 'deno', 'node')}
    result['yt_dlp'] = bool(importlib.util.find_spec('yt_dlp'))
    return result


def command(req: DownloadRequest, target: Path, deps=None):
    req.validate()
    deps = deps or dependencies()
    args = [sys.executable, '-m', 'yt_dlp', '--ignore-config', '--no-playlist',
            '--no-overwrites', '--no-post-overwrites', '--continue', '--newline', '--no-colors', '--progress',
            '--socket-timeout', '20', '--retries', '5', '--fragment-retries', '5',
            '--abort-on-unavailable-fragments', '--match-filters', '!is_live & !is_upcoming',
            '--windows-filenames', '--trim-filenames', '160',
            '--paths', str(target), '-o', '%(title).120B [%(id)s].%(ext)s',
            '--print', 'after_move:FILE:%(filepath)j', '--no-simulate',
            '--progress-template', 'download:PROGRESS:%(progress)j']
    if deps.get('deno'):
        args += ['--js-runtimes', 'deno']
    elif deps.get('node'):
        args += ['--js-runtimes', 'node']
    if req.mode == 'video':
        # No extension/codec restriction: do not silently sacrifice quality for compatibility.
        args += ['-f', 'bv+ba/b',
                 '--merge-output-format', req.container, '--remux-video', req.container]
        if req.subtitles:
            # Sidecars avoid burning/recompressing video and work for both containers.
            args += ['--write-subs', '--sub-langs', 'pt.*,pt', '--sub-format', 'srt/vtt/best']
    else:
        # Native audio container: never pretend conversion to MP3 creates more quality.
        args += ['-f', 'ba/b[acodec!=none][vcodec=none]']
    return args + ['--', req.url.strip()]


def stop_process(proc):
    if proc.poll() is not None:
        return
    if os.name == 'nt':
        subprocess.run(['taskkill', '/PID', str(proc.pid), '/T', '/F'], capture_output=True)
    else:
        try:
            os.killpg(proc.pid, signal.SIGTERM)
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            os.killpg(proc.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass


def probe(path):
    proc = subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format',
                           '-of', 'json', str(path)], capture_output=True, text=True,
                          encoding='utf-8', errors='replace', timeout=60)
    if proc.returncode:
        raise RuntimeError('Não foi possível validar o arquivo com FFprobe: ' + proc.stderr[-500:])
    return json.loads(proc.stdout)


def create_download_folder(base: Path) -> Path:
    """Sequential names, with atomic allocation for concurrent downloads."""
    base.mkdir(parents=True, exist_ok=True)
    prefix = 'Golden Music Memories MP4 '
    pattern = re.compile(re.escape(prefix) + r'(\d+)$')
    numbers = [int(match.group(1)) for item in base.iterdir()
               if (match := pattern.fullmatch(item.name))]
    number = max(numbers, default=0) + 1
    while True:
        target = base / f'{prefix}{number:03d}'
        try:
            target.mkdir(exist_ok=False)
            return target
        except FileExistsError:
            number += 1


def download(req: DownloadRequest, emit=None, cancel: Event | None = None):
    """Bloqueante. Execute em worker. emit recebe dicts; cancel cancela toda a árvore."""
    req.validate()
    emit = emit or (lambda event: None)
    cancel = cancel or Event()
    if cancel.is_set():
        raise Cancelled('Cancelado antes de iniciar.')
    deps = dependencies()
    missing = [n for n in ('ffmpeg', 'ffprobe', 'yt_dlp') if not deps[n]]
    if not (deps['deno'] or deps['node']):
        missing.append('Deno ou Node.js')
    if missing:
        raise RuntimeError('Instale as dependências: ' + ', '.join(missing))
    base = Path(req.output).expanduser().resolve()
    # Isolated job folders prevent collisions and accidental overwrites.
    target = create_download_folder(base)
    emit({'type': 'started', 'folder': str(target)})
    kwargs = {'creationflags': subprocess.CREATE_NEW_PROCESS_GROUP} if os.name == 'nt' else {'start_new_session': True}
    proc = subprocess.Popen(command(req, target, deps), stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, text=True, encoding='utf-8',
                            errors='replace', **kwargs)
    lines = queue.Queue()
    def reader():
        try:
            for line in proc.stdout:
                lines.put(line.rstrip())
        finally:
            lines.put(None)
    thread = threading.Thread(target=reader, daemon=True)
    thread.start()
    outputs, tail = [], []
    try:
        while True:
            if cancel.is_set():
                raise Cancelled('Download cancelado. Arquivos parciais foram preservados na pasta.')
            try:
                line = lines.get(timeout=.15)
            except queue.Empty:
                continue
            if line is None:
                break
            if line.startswith('FILE:'):
                outputs.append(Path(json.loads(line[5:])))
            elif line.startswith('PROGRESS:'):
                try:
                    progress = json.loads(line[9:])
                    total = progress.get('total_bytes') or progress.get('total_bytes_estimate') or 0
                    emit({'type': 'progress', 'percent': min(100, 100 * progress.get('downloaded_bytes', 0) / total) if total else None})
                except (ValueError, TypeError):
                    pass
            else:
                tail = (tail + [line])[-12:]
                emit({'type': 'log', 'message': line})
        code = proc.wait()
        if cancel.is_set():
            raise Cancelled('Cancelado.')
        if code or not outputs:
            raise RuntimeError('Download não concluído. Se houve incompatibilidade de MP4, tente MKV.\n' + '\n'.join(tail))
        results = []
        for path in outputs:
            path = path.resolve()
            if not path.is_relative_to(target) or not path.is_file():
                raise RuntimeError('Arquivo de saída inválido.')
            if cancel.is_set():
                raise Cancelled('Cancelado antes da verificação.')
            info = probe(path)
            types = {s.get('codec_type') for s in info.get('streams', [])}
            if 'audio' not in types or (req.mode == 'video' and 'video' not in types):
                raise RuntimeError('O arquivo não contém as faixas de áudio/vídeo esperadas.')
            if req.mode == 'video' and path.suffix.lower() != '.' + req.container:
                raise RuntimeError('O contêiner final não corresponde ao solicitado.')
            results.append({'path': str(path), 'bytes': path.stat().st_size, 'media': info})
        report = {'source': req.url, 'mode': req.mode, 'reencoded': False,
                  'files': results, 'subtitles': [str(p) for p in target.glob('*') if p.suffix in {'.srt', '.vtt', '.ttml'}],
                  'note': 'Qualidade disponível à sessão atual. Verificação estrutural; não prova integridade da fonte.'}
        (target / 'relatorio.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        emit({'type': 'complete', 'report': report})
        return report
    finally:
        stop_process(proc)
        proc.wait()
        thread.join(timeout=2)
        proc.stdout.close()
