#!/usr/bin/env python3
# Локальный сервер для запуска игры: то же, что `python3 -m http.server 8000`,
# но с запретом кэширования. Без этого Safari (и другие браузеры) могут
# держать в кэше старые ES-модули: после правок файлов браузер смешивает
# новые и старые и на экране появляются «undefined» или старые сцены.
# Запуск: python3 serve.py [порт]
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    server = ThreadingHTTPServer(('127.0.0.1', port), NoCacheHandler)
    print(f'Игра: http://localhost:{port} (кэш выключен)')
    server.serve_forever()


if __name__ == '__main__':
    main()
