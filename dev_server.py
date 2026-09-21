import http.server, os, socketserver

os.chdir(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".css": "text/css",
        ".html": "text/html",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


class Server(socketserver.ThreadingTCPServer):
    # threaded: a held-open browser connection must not wedge every other request
    allow_reuse_address = True
    daemon_threads = True


with Server(("127.0.0.1", 8790), Handler) as server:
    server.serve_forever()
