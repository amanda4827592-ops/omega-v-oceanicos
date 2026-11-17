#!/usr/bin/env python3
"""Create a portable SHA-256 manifest for selected files.

Paths in the output are relative to --root. The output manifest is excluded
from hashing to avoid circular self-reference.
"""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--commit", default="unknown")
    parser.add_argument("files", nargs="+")
    args = parser.parse_args()

    root = args.root.resolve()
    output = args.output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    paths = []
    for raw in args.files:
        path = (root / raw).resolve()
        if path == output:
            raise SystemExit("manifest output must not be included in files")
        if not path.is_file() or root not in path.parents:
            raise SystemExit(f"missing or out-of-root file: {raw}")
        paths.append(path)

    lines = [
        "# SHA-256 integrity manifest",
        f"# root: {root}",
        f"# commit: {args.commit}",
        "# manifest is excluded to avoid circular hashing",
        "# verify with: sha256sum -c <manifest> from the manifest root",
        "",
    ]
    for path in paths:
        lines.append(f"{digest(path)}  {path.relative_to(root).as_posix()}")
    output.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {len(paths)} entries to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
