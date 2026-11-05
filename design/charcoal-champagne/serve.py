"""Serve only the design preview and its explicitly allowed local assets."""
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit
import mimetypes

HERE=Path(__file__).resolve().parent
ROOT=HERE.parent.parent
FILES={'/':HERE/'index.html','/index.html':HERE/'index.html'}
for name in ('styles.css','refinements.css','preview.js','icons.js'):
    FILES['/'+name]=HERE/name
for name in ('salon','royal','barber'):
    key=f'/apps/customer/assets/images/{name}.jpg'
    FILES[key]=ROOT/key.lstrip('/')
for folder in ('400Regular','500Medium','700Bold'):
    key=f'/node_modules/@expo-google-fonts/dm-sans/{folder}/DMSans_{folder}.ttf'
    FILES[key]=ROOT/key.lstrip('/')

class Preview(BaseHTTPRequestHandler):
    def do_GET(self):
        file=FILES.get(urlsplit(self.path).path)
        if not file or not file.is_file():
            self.send_error(404);return
        data=file.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type',mimetypes.guess_type(file)[0] or 'application/octet-stream')
        self.send_header('Content-Length',str(len(data)))
        self.send_header('Cache-Control','no-store')
        self.end_headers();self.wfile.write(data)
    def log_message(self,*args):pass

if __name__=='__main__':
    print('BookMyTurn design preview: http://127.0.0.1:9077',flush=True)
    ThreadingHTTPServer(('127.0.0.1',9077),Preview).serve_forever()
