#!/usr/bin/env python3
"""Bounded NumPy companion for the 4D DAV tensor contract."""
from __future__ import annotations
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
import numpy as np

SUPPORTED_SIZES = {4, 6, 8}


def tensor_payload(size: int) -> dict[str, object]:
    if size not in SUPPORTED_SIZES:
        raise ValueError("size must be one of 4, 6, 8")
    indices = np.indices((size, size, size, size), dtype=np.int64)
    tensor = indices.sum(axis=0)
    matrix = tensor.reshape(size * size, size * size)
    return {
        "size": size,
        "shape_4d": list(tensor.shape),
        "shape_2d": list(matrix.shape),
        "min_val": int(tensor.min()),
        "max_val": int(tensor.max()),
        "checksum": int(tensor.sum()),
        "matrix_2d": matrix.tolist(),
    }


class Handler(BaseHTTPRequestHandler):
    def _send(self, status: int, payload: dict[str, object]) -> None:
        encoded = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path == "/health":
            self._send(200, {"status": "ok", "service": "oceanicos-python-tensor-companion", "numpy": np.__version__})
            return
        if path.startswith("/tensor/"):
            try:
                size = int(path.rsplit("/", 1)[-1])
                self._send(200, tensor_payload(size))
            except (ValueError, TypeError):
                self._send(400, {"status": "DIVERGENT", "error": "TENSOR_SIZE_UNSUPPORTED", "supportedSizes": [4, 6, 8]})
            return
        self._send(404, {"status": "UNKNOWN", "error": "NOT_FOUND"})

    def log_message(self, format: str, *args: object) -> None:
        return


def serve(host: str = "127.0.0.1", port: int = 8000) -> None:
    ThreadingHTTPServer((host, port), Handler).serve_forever()


if __name__ == "__main__":
    serve()
