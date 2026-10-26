"""Golden downloader: official yt-dlp Python API, structured events and durable results."""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import queue
import subprocess
import threading
import time

import yt_dlp
from yt_dlp.postprocessor import FFmpegMetadataPP, EmbedThumbnailPP, FFmpegVideoRemuxerPP
from yt_dlp.postprocessor.common import PostProcessor
from yt_dlp.utils import PostProcessingError
from media_downloader.core import probe

MP4_FORMAT = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
METADATA_KEYS = ('id', 'title', 'track', 'artist', 'artists', 'album', 'release_year', 'upload_date', 'uploader', 'channel')

class GoldenYoutubeDL(yt_dlp.YoutubeDL):
    golden_skipped = False

    def in_download_archive(self, info):
        found = super().in_download_archive(info)
        if found:
            self.golden_skipped = True
        return found


class EventLogger:
    def __init__(self, emit):
        self.emit = emit

    def debug(self, message):
        pass

    def warning(self, message):
        self.emit({'type': 'warning', 'message': str(message)[-1800:]})

    def error(self, message):
        self.emit({'type': 'error', 'message': str(message)[-1800:]})


def options(output, node, tools, emit, archive=None, mode='video', container='mp4', subtitles=True, max_bytes=8589934592, max_height=None):
    """Leave YouTube client choice and HTTP headers to maintained yt-dlp defaults."""
    last_progress = 0
    def progress(data):
        nonlocal last_progress
        now = time.monotonic()
        if data.get('status') == 'downloading' and now - last_progress < 0.5:
            return
        last_progress = now
        info = data.get('info_dict') or {}
        total = data.get('total_bytes') or data.get('total_bytes_estimate') or 0
        emit({'type': 'progress', 'percent': min(100, data.get('downloaded_bytes', 0) * 100 / total) if total else None,
              'speed': data.get('speed'), 'eta': data.get('eta'), 'title': info.get('title'),
              'downloadedBytes': data.get('downloaded_bytes'), 'totalBytes': total,
              'phase': 'Processando arquivo' if data.get('status') == 'finished' else 'Baixando fluxo atual'})

    if max_height not in (None, 720, 1080):
        raise ValueError('Escolha qualidade original, 720p ou 1080p.')
    selection = MP4_FORMAT if mode == 'video' and container == 'mp4' else 'bv+ba/b' if mode == 'video' else 'ba/b[acodec!=none][vcodec=none]'
    if mode == 'video' and max_height:
        limit = f'[height<={max_height}]'
        selection = f'bestvideo[ext=mp4]{limit}+bestaudio[ext=m4a]/best[ext=mp4]{limit}/best{limit}' if container == 'mp4' else f'bv{limit}+ba/b{limit}'
    return {
        'format': selection,
        'format_sort': ['res', 'fps', 'vcodec:h264', 'acodec:aac'] if mode == 'video' and max_height == 720 else [],
        'merge_output_format': container,
        'outtmpl': str(Path(output) / '%(title).120B [%(id)s].%(ext)s'),
        'download_archive': str(archive) if archive else None,
        'noplaylist': True, 'windowsfilenames': True, 'overwrites': False, 'continuedl': True,
        'keepvideo': True, 'quiet': True, 'noprogress': True, 'logger': EventLogger(emit),
        'progress_hooks': [progress],
        'postprocessor_hooks': [lambda d: emit({'type': 'phase', 'phase': 'Finalizando metadados e capa', 'title': (d.get('info_dict') or {}).get('title')})],
        'socket_timeout': 30, 'retries': 5, 'fragment_retries': 5, 'extractor_retries': 3,
        'file_access_retries': 3, 'concurrent_fragment_downloads': 4,
        'retry_sleep_functions': {'http': lambda n: min(30, 2 ** n), 'fragment': lambda n: min(15, 2 ** n)},
        'sleep_interval_requests': 1, 'sleep_interval': 1, 'max_sleep_interval': 3,
        'skip_unavailable_fragments': False, 'max_filesize': int(max_bytes),
        'ffmpeg_location': str(tools), 'js_runtimes': {'node': {'path': str(node)}},
        'remote_components': [], 'cachedir': False, 'writeinfojson': True,
        'writethumbnail': True, 'addmetadata': True,
        'writesubtitles': bool(subtitles and mode == 'video'), 'subtitleslangs': ['pt.*', 'pt'],
        'subtitlesformat': 'srt/vtt/best',
        'match_filter': lambda info, *, incomplete=False: 'Transmissões ao vivo não entram nesta fila.' if info.get('is_live') or info.get('is_upcoming') else None,
    }


class CompatibleMP4PP(PostProcessor):
    """Copy compatible streams; encode only incompatible streams, preserving the source."""
    def __init__(self, downloader, tools, emit):
        super().__init__(downloader)
        self.tools, self.emit = Path(tools), emit

    def run(self, info):
        source = Path(info['filepath'])
        media = probe(source)
        video = next((s for s in media['streams'] if s['codec_type'] == 'video' and not s.get('disposition', {}).get('attached_pic')), None)
        audio = next((s for s in media['streams'] if s['codec_type'] == 'audio'), None)
        if not video or not audio:
            raise PostProcessingError('O arquivo precisa conter vídeo e áudio.')
        copy_video = video.get('codec_name') == 'h264' and video.get('pix_fmt') == 'yuv420p'
        copy_audio = audio.get('codec_name') == 'aac'
        if copy_video and copy_audio and source.suffix.lower() == '.mp4':
            info['golden_reencoded'] = False
            return [], info
        target = source.with_name(source.stem + '.h264.mp4')
        temp = target.with_name(target.stem + '.working.mp4')
        self.emit({'type': 'phase', 'phase': 'Preparando MP4 H.264/AAC', 'title': info.get('title')})
        exe = self.tools / ('ffmpeg.exe' if os.name == 'nt' else 'ffmpeg')
        args = [str(exe), '-v', 'error', '-y', '-i', str(source), '-map', '0:V:0', '-map', '0:a:0', '-map_metadata', '0']
        args += ['-c:v', 'copy'] if copy_video else ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2']
        args += ['-c:a', 'copy'] if copy_audio else ['-c:a', 'aac', '-b:a', '256k']
        result = subprocess.run(args + ['-movflags', '+faststart', str(temp)], capture_output=True, timeout=14400)
        if result.returncode:
            raise PostProcessingError('Falha ao preparar MP4: ' + result.stderr.decode('utf-8', 'replace')[-700:])
        os.replace(temp, target)
        info.update(filepath=str(target), ext='mp4', golden_reencoded=not (copy_video and copy_audio))
        return [], info


class NativeThumbnailPP(EmbedThumbnailPP):
    def run(self, info):
        if info.get('ext') not in {'mp3', 'm4a', 'mp4', 'm4v', 'mov', 'mkv', 'mka', 'ogg', 'opus', 'flac'}:
            self.report_warning('Este contêiner original não aceita capa embutida; a miniatura baixada permanece no processamento.')
            return [], info
        return super().run(info)


class DeliveryReportPP(PostProcessor):
    def __init__(self, downloader, output, req, reports, emit):
        super().__init__(downloader)
        self.output, self.req, self.reports, self.emit = Path(output).resolve(), req, reports, emit

    def run(self, info):
        path = Path(info['filepath']).resolve()
        if not path.is_relative_to(self.output) or not path.is_file():
            raise PostProcessingError('Saída fora da pasta deste download.')
        media = probe(path)
        streams = media.get('streams', [])
        video = next((s for s in streams if s['codec_type'] == 'video' and not s.get('disposition', {}).get('attached_pic')), None)
        audio = next((s for s in streams if s['codec_type'] == 'audio'), None)
        if not audio or self.req.mode == 'video' and not video:
            raise PostProcessingError('A mídia final não contém os fluxos esperados.')
        if self.req.mode == 'video' and self.req.container == 'mp4' and (video['codec_name'] != 'h264' or audio['codec_name'] != 'aac'):
            raise PostProcessingError('MP4 não passou na verificação H.264/AAC.')
        report = {'files': [{'path': str(path), 'bytes': path.stat().st_size, 'media': media}],
                  'metadata': {k: info.get(k) for k in METADATA_KEYS}, 'reencoded': info.get('golden_reencoded', False),
                  'subtitles': [str(p) for p in self.output.glob('*') if p.suffix in {'.srt', '.vtt', '.ttml'}],
                  'thumbnailEmbedded': any(s.get('disposition', {}).get('attached_pic') or s.get('codec_type') == 'attachment' for s in streams)}
        # Write before yt-dlp records the archive; a failed panel copy can replay this result.
        with path.open('rb') as stream:
            report['sha256'] = hashlib.file_digest(stream, 'sha256').hexdigest()
        tmp = self.output / 'resultado.json.tmp'
        tmp.write_text(json.dumps(report, ensure_ascii=False), encoding='utf-8')
        os.replace(tmp, self.output / 'resultado.json')
        self.reports.append(report)
        return [], info


def download(req, tools, node, archive, emit, max_bytes=8589934592, ydl_factory=GoldenYoutubeDL, max_height=None):
    """Runs in the bridge worker. One panel queue item is one video."""
    req.validate()
    output = Path(req.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    if archive:
        Path(archive).parent.mkdir(parents=True, exist_ok=True)
    saved = output / 'resultado.json'
    if saved.exists():
        report = json.loads(saved.read_text(encoding='utf-8'))
        path = Path(report['files'][0]['path']).resolve()
        if path.is_relative_to(output) and path.is_file():
            with path.open('rb') as f:
                if hashlib.file_digest(f, 'sha256').hexdigest() == report.get('sha256'):
                    emit({'type': 'complete', 'report': report})
                    return report
    emit({'type': 'started'})
    reports = []
    opts = options(output, node, tools, emit, archive, req.mode, req.container, req.subtitles, max_bytes, max_height)
    with ydl_factory(opts) as ydl:
        if req.mode == 'video':
            if req.container == 'mp4':
                ydl.add_post_processor(CompatibleMP4PP(ydl, tools, emit))
            else:
                ydl.add_post_processor(FFmpegVideoRemuxerPP(ydl, preferedformat='mkv'))
        ydl.add_post_processor(FFmpegMetadataPP(ydl, add_metadata=True))
        ydl.add_post_processor(NativeThumbnailPP(ydl))
        ydl.add_post_processor(DeliveryReportPP(ydl, output, req, reports, emit), when='after_move')
        code = ydl.download([req.url])
        if code:
            raise RuntimeError('O yt-dlp não concluiu o download. Confira a mensagem da fonte.')
        if not reports and not getattr(ydl, 'golden_skipped', False):
            raise RuntimeError('Nenhum arquivo final: confira disponibilidade, tamanho e formato da fonte.')
    report = reports[-1] if reports else {'files': [], 'skipped': True, 'metadata': {}}
    emit({'type': 'complete', 'report': report})
    return report


def expand_playlist(req, tools, node, emit, ydl_factory=yt_dlp.YoutubeDL):
    req.validate()
    opts = options(req.output, node, tools, emit)
    opts.update(extract_flat='in_playlist', lazy_playlist=True, skip_download=True, noplaylist=False, ignoreerrors=False, writethumbnail=False, writeinfojson=False)
    with ydl_factory(opts) as ydl:
        info = ydl.extract_info(req.url, download=False)
        if not info or info.get('_type') not in {'playlist', 'multi_video'}:
            raise RuntimeError('A fonte não retornou uma playlist.')
        count = unavailable = 0
        for item in info.get('entries') or []:
            if not item:
                unavailable += 1
                continue
            count += 1
            emit({'type': 'entry', 'url': item.get('webpage_url') or item.get('url'), 'id': item.get('id'),
                  'title': item.get('title'), 'playlistTitle': info.get('title'), 'index': count})
        if unavailable:
            emit({'type': 'warning', 'message': f'{unavailable} entradas não foram disponibilizadas pela fonte.'})
        emit({'type': 'complete', 'report': {'playlist': True, 'count': count, 'title': info.get('title'), 'files': []}})


def threaded(task, emit):
    """A worker owns YoutubeDL; stdout events are dispatched by the main thread."""
    events = queue.Queue(maxsize=200)
    def work():
        try:
            task(events.put)
        except Exception as error:
            events.put({'type': 'error', 'message': str(error), 'fatal': True})
        finally:
            events.put(None)
    worker = threading.Thread(target=work, name='golden-yt-dlp', daemon=False)
    worker.start()
    failed = False
    while True:
        event = events.get()
        if event is None:
            break
        failed |= event.get('fatal', False)
        emit(event)
    worker.join()
    return not failed
