"""Only generated media and loopback HTTP. No requests to external platforms."""
import functools
import hashlib
import http.server
import os
from pathlib import Path
import shutil
import subprocess
import sys
import threading
import unittest
import uuid
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'server/media-downloader'))
import engine
from media_downloader.core import DownloadRequest, probe
from yt_dlp.extractor.common import InfoExtractor
from mutagen.mp4 import MP4

TOOLS = ROOT / '.cache/import-tools'
os.environ['PATH'] = str(TOOLS) + os.pathsep + os.environ['PATH']
NODE = shutil.which('node')
FF = str(TOOLS / ('ffmpeg.exe' if os.name == 'nt' else 'ffmpeg'))

class FixtureRequest(DownloadRequest):
    def validate(self):
        assert self.url.startswith('goldenfixture:')

class QuietHTTP(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

class APITest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root = ROOT / '.cache/baixador-v219' / ('api-' + uuid.uuid4().hex[:8])
        cls.root = Path('\\\\?\\' + str(root)) if os.name == 'nt' else root
        cls.root.mkdir(parents=True)
        cls.media = cls.root / 'source.mp4'
        subprocess.run([FF, '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=25:duration=1', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', str(cls.media)], check=True)
        subprocess.run([FF, '-v', 'error', '-i', str(cls.media), '-c:v', 'libvpx-vp9', '-deadline', 'realtime', '-c:a', 'libopus', str(cls.root / 'source.webm')], check=True)
        subprocess.run([FF, '-v', 'error', '-f', 'lavfi', '-i', 'color=c=gold:s=640x360', '-frames:v', '1', str(cls.root / 'cover.png')], check=True)
        cls.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHTTP, directory=str(cls.root)))
        cls.server_thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.server_thread.start()
        origin = 'http://127.0.0.1:' + str(cls.server.server_port)

        class GoldenFixtureIE(InfoExtractor):
            IE_NAME = 'goldenfixture'
            _VALID_URL = r'goldenfixture:(?P<id>[a-z]+)'
            def _real_extract(self, url):
                identity = self._match_id(url)
                ext = 'webm' if identity == 'incompatible' else 'mp4'
                return {'id': identity, 'title': 'Faixa de teste', 'track': 'Canção', 'artist': 'Banda Golden', 'album': 'Álbum sintético', 'release_year': 1984,
                        'thumbnail': origin + '/cover.png', 'formats': [{'url': origin + '/source.' + ext, 'ext': ext, 'vcodec': 'vp9' if ext == 'webm' else 'h264', 'acodec': 'opus' if ext == 'webm' else 'aac', 'width': 320, 'height': 180}]}

        class FixtureYDL(engine.GoldenYoutubeDL):
            def __init__(self, opts):
                opts.update(sleep_interval=0, sleep_interval_requests=0, max_sleep_interval=0)
                super().__init__(opts, auto_init=False)
                self.add_info_extractor(GoldenFixtureIE())
        cls.factory = FixtureYDL

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.server_thread.join()

    def execute(self, identity, folder, archive=None):
        events = []
        req = FixtureRequest('goldenfixture:' + identity, str(self.root / folder), 'mp4', 'video', False)
        result = engine.download(req, TOOLS, NODE, archive, events.append, ydl_factory=self.factory)
        return result, events

    def test_mp4_metadata_cover_archive_and_replay(self):
        archive = self.root / 'historico_downloads.txt'
        source_hash = hashlib.sha256(self.media.read_bytes()).hexdigest()
        result, events = self.execute('compatible', 'first', archive)
        path = result['files'][0]['path']
        tags = MP4(path)
        self.assertEqual(tags['\xa9ART'], ['Banda Golden'])
        self.assertEqual(tags['\xa9alb'], ['Álbum sintético'])
        self.assertTrue(tags['covr'])
        self.assertTrue(result['thumbnailEmbedded'])
        self.assertFalse(result['reencoded'])
        self.assertTrue(any(e['type'] == 'progress' for e in events))
        packet_hash = lambda p: subprocess.check_output([FF, '-v', 'error', '-i', str(p), '-map', '0:a:0', '-c', 'copy', '-f', 'hash', '-hash', 'sha256', '-'])
        self.assertEqual(packet_hash(path), packet_hash(self.media))
        self.assertEqual(hashlib.sha256(self.media.read_bytes()).hexdigest(), source_hash)
        self.assertIn('compatible', archive.read_text())
        skipped, _ = self.execute('compatible', 'second', archive)
        self.assertTrue(skipped['skipped'])
        replay, _ = self.execute('compatible', 'first', archive)
        self.assertEqual(replay['sha256'], result['sha256'])
        subprocess.run([FF, '-v', 'error', '-i', path, '-f', 'null', '-'], check=True)

    def test_incompatible_streams_become_h264_aac(self):
        result, _ = self.execute('incompatible', 'converted')
        media = result['files'][0]['media']
        streams = media['streams']
        self.assertEqual(next(s for s in streams if s['codec_type'] == 'video' and not s.get('disposition', {}).get('attached_pic'))['codec_name'], 'h264')
        self.assertEqual(next(s for s in streams if s['codec_type'] == 'audio')['codec_name'], 'aac')
        self.assertTrue(result['reencoded'])
        self.assertTrue(result['thumbnailEmbedded'])
        self.assertAlmostEqual(float(media['format']['duration']), 1, delta=.1)
        subprocess.run([FF, '-v', 'error', '-i', result['files'][0]['path'], '-f', 'null', '-'], check=True)

    def test_failed_final_validation_does_not_mark_archive(self):
        archive = self.root / 'failed_history.txt'
        with patch.object(engine.DeliveryReportPP, 'run', side_effect=engine.PostProcessingError('conferência sintética falhou')):
            with self.assertRaises(Exception):
                self.execute('failure', 'failure', archive)
        self.assertFalse(archive.exists() and 'failure' in archive.read_text())

    def test_playlist_501_entries_and_worker(self):
        events, threads, options = [], [], []
        class PlaylistYDL:
            def __init__(self, opts): options.append(opts)
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def extract_info(self, url, download):
                threads.append(threading.current_thread().name)
                assert not download
                return {'_type': 'playlist', 'title': '501 faixas', 'entries': ({'id': f'{i:011}', 'url': 'https://www.youtube.com/watch?v=' + f'{i:011}', 'title': f'Faixa {i}'} for i in range(501))}
        req = FixtureRequest('goldenfixture:playlist', str(self.root / 'playlist'))
        self.assertTrue(engine.threaded(lambda emit: engine.expand_playlist(req, TOOLS, NODE, emit, ydl_factory=PlaylistYDL), events.append))
        self.assertEqual(len([e for e in events if e['type'] == 'entry']), 501)
        self.assertEqual(threads, ['golden-yt-dlp'])
        self.assertFalse(options[0]['noplaylist'])
        self.assertTrue(options[0]['lazy_playlist'])
        self.assertFalse(engine.threaded(lambda emit: (_ for _ in ()).throw(ValueError('falha sintética')), events.append))
        self.assertTrue(events[-1]['fatal'])

if __name__ == '__main__':
    unittest.main(verbosity=2)
