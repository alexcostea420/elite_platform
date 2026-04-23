"""
Lockfile helper for cron scripts. Prevents overlapping runs.

Usage:
    from common.lockfile import acquire_lock_or_exit
    acquire_lock_or_exit("sync_trading_data")
    # ... rest of script

If another instance is running, exits 0 silently.
The lock is released when the process exits.
"""

from __future__ import annotations

import fcntl
import os
import sys
import tempfile

# Keep a module-level reference so GC doesn't close the fd
_LOCK_FD = None


def acquire_lock_or_exit(name: str) -> None:
    global _LOCK_FD
    lock_path = os.path.join(tempfile.gettempdir(), f"elite_platform_{name}.lock")
    fd = open(lock_path, "w")
    try:
        fcntl.flock(fd.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        print(f"[lockfile] {name} already running, exiting", flush=True)
        fd.close()
        sys.exit(0)
    fd.write(str(os.getpid()))
    fd.flush()
    _LOCK_FD = fd
