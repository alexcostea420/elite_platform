#!/usr/bin/env python3
"""
Upload video files from data/videos/ to Cloudflare R2.
Usage: python3 scripts/upload_to_r2.py [filename.mp4]
       python3 scripts/upload_to_r2.py --all
"""

import boto3
import os
import sys

R2_ENDPOINT = os.environ.get("R2_ENDPOINT", "")
R2_ACCESS_KEY = os.environ.get("R2_ACCESS_KEY_ID", "")
R2_SECRET_KEY = os.environ.get("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET = os.environ.get("R2_BUCKET", "elite-videos")

if not R2_ENDPOINT or not R2_ACCESS_KEY or not R2_SECRET_KEY:
    # Try loading from .env.local
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env.local")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())
        R2_ENDPOINT = os.environ.get("R2_ENDPOINT", "")
        R2_ACCESS_KEY = os.environ.get("R2_ACCESS_KEY_ID", "")
        R2_SECRET_KEY = os.environ.get("R2_SECRET_ACCESS_KEY", "")
    if not R2_ENDPOINT or not R2_ACCESS_KEY or not R2_SECRET_KEY:
        print("ERROR: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY must be set in env or .env.local")
        sys.exit(1)
R2_PUBLIC_URL = "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev"
VIDEO_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "videos")

s3 = boto3.client("s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    region_name="auto",
)

def upload_file(filepath):
    filename = os.path.basename(filepath)
    key = f"videos/{filename}"
    size_mb = os.path.getsize(filepath) / (1024 * 1024)

    print(f"Uploading {filename} ({size_mb:.1f} MB)...")

    # Use multipart upload for large files
    s3.upload_file(
        filepath, R2_BUCKET, key,
        ExtraArgs={"ContentType": "video/mp4"},
    )

    public_url = f"{R2_PUBLIC_URL}/{key}"
    print(f"  OK: {public_url}")
    return public_url

def main():
    if len(sys.argv) < 2:
        print(f"Usage: python3 {sys.argv[0]} <filename.mp4> | --all")
        print(f"Video dir: {VIDEO_DIR}")
        sys.exit(1)

    if sys.argv[1] == "--all":
        files = [f for f in os.listdir(VIDEO_DIR) if f.endswith(".mp4")]
        if not files:
            print(f"No .mp4 files in {VIDEO_DIR}")
            sys.exit(1)
        print(f"Uploading {len(files)} files...")
        for f in sorted(files):
            upload_file(os.path.join(VIDEO_DIR, f))
    else:
        filepath = sys.argv[1]
        if not os.path.isabs(filepath):
            filepath = os.path.join(VIDEO_DIR, filepath)
        if not os.path.exists(filepath):
            print(f"File not found: {filepath}")
            sys.exit(1)
        upload_file(filepath)

if __name__ == "__main__":
    main()
