import json
import os
import subprocess
from http.server import BaseHTTPRequestHandler, HTTPServer


PORT = int(os.environ.get("PORT", "8080"))
POSTGRES_DB = os.environ.get("POSTGRES_DB", "aeroplane_test")
POSTGRES_USER = os.environ.get("POSTGRES_USER", "aeroplane")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "aeroplane")


def run_psql(sql):
    result = subprocess.run(
        [
            "psql",
            "-h",
            "127.0.0.1",
            "-U",
            POSTGRES_USER,
            "-d",
            POSTGRES_DB,
            "-t",
            "-A",
            "-c",
            sql,
        ],
        check=True,
        capture_output=True,
        env={**os.environ, "PGPASSWORD": POSTGRES_PASSWORD},
        text=True,
    )
    return result.stdout.strip()


def read_messages():
    payload = run_psql(
        """
        SELECT COALESCE(json_agg(row_to_json(messages) ORDER BY id), '[]'::json)
        FROM messages;
        """
    )
    return json.loads(payload or "[]")


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            run_psql("SELECT 1;")
            self.send_json(200, {"status": "ok", "database": "postgres"})
            return

        if self.path == "/":
            self.send_json(200, {"message": "hello from dockerfile app with postgres"})
            return

        if self.path == "/messages":
            self.send_json(200, {"messages": read_messages()})
            return

        self.send_text(404, "not found\n")

    def log_message(self, format, *args):
        print(format % args)

    def send_json(self, status_code, body):
        payload = json.dumps(body).encode("utf-8")
        self.send_response(status_code)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def send_text(self, status_code, body):
        payload = body.encode("utf-8")
        self.send_response(status_code)
        self.send_header("content-type", "text/plain; charset=utf-8")
        self.send_header("content-length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


server = HTTPServer(("0.0.0.0", PORT), Handler)
print(f"dockerfile postgres app listening on :{PORT}")
server.serve_forever()
