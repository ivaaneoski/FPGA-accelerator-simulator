#!/usr/bin/env python
"""Start both backend and frontend dev servers.

Usage:  python run.py

If you see "port already in use", close any previous instance first.
On Windows you can close Git Bash / WSL windows that spawned the servers.
"""

import os
import shutil
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.abspath(__file__))
BE_PORT = 8000
FE_PORT = 5173


def find_npx():
    p = shutil.which("npx.cmd") or shutil.which("npx")
    if p:
        return p
    for base in (r"C:\Program Files\nodejs", r"C:\Program Files (x86)\nodejs"):
        for name in ("npx.cmd", "npm.cmd"):
            f = os.path.join(base, name)
            if os.path.isfile(f):
                return f
    raise RuntimeError("npx not found. Install Node.js.")


def main():
    be = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app",
         "--host", "127.0.0.1", "--port", str(BE_PORT)],
        cwd=os.path.join(ROOT, "backend"),
    )

    fe = subprocess.Popen(
        f'cmd /c "{find_npx()}" vite --port {FE_PORT}',
        cwd=os.path.join(ROOT, "frontend"), shell=True,
    )

    time.sleep(3)

    b = "=" * 60
    print(f"\n{b}")
    print("  FPGA-NN Accelerator Simulator")
    print(f"{b}")
    print(f"  Frontend:  http://localhost:{FE_PORT}")
    print(f"  Backend:   http://localhost:{BE_PORT}")
    print(f"  API docs:  http://localhost:{BE_PORT}/docs")
    print(f"{'=' * 60}")
    print("  Press Ctrl+C to stop.\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        be.terminate()
        fe.terminate()


if __name__ == "__main__":
    main()
