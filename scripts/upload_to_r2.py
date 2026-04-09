#!/usr/bin/env python3
"""
Upload video files from data/videos/ to Cloudflare R2.
Usage: python3 scripts/upload_to_r2.py [filename.mp4]
       python3 scripts/upload_to_r2.py --all
"""

import boto3
import os
import sys

R2_ENDPOINT = os.environ.get("R2_ENDPOINT", "https://17c9556f942f7433e51a7dce681a4bb8.r2.cloudflarestorage.com")
R2_ACCESS_KEY = os.environ.get("R2_ACCESS_KEY_ID", "e9914f648fd84301c3686a5810dcbcaf")
R2_SECRET_KEY = os.environ.get("R2_SECRET_ACCESS_KEY", "0063561c21aa580b8c24e58351369327ac8b2c92a34823af136b37140e021548")
R2_BUCKET = os.environ.get("R2_BUCKET", "elite-videos")
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
