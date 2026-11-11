"""Build the browser's verified APK payload on the GitHub Actions runner."""

import hashlib
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

REPOSITORY = "hogaamiye/Waalid-Kaab-Release"
CHUNK_SIZE = 8 * 1024 * 1024
MAX_SIZE = 300 * 1024 * 1024


def choose_asset(release):
    if release.get("draft") or release.get("prerelease"):
        raise ValueError("A stable published release is required")
    candidates = []
    for asset in release.get("assets", []):
        match = re.fullmatch(
            r"waalid-kaab-companion-build-([1-9][0-9]{0,8})\.apk",
            asset.get("name", ""),
        )
        if match and asset.get("state") == "uploaded":
            candidates.append((int(match[1]), asset))
    if not candidates:
        raise ValueError("The latest release has no Companion APK")
    build, asset = max(candidates, key=lambda item: item[0])
    if not re.fullmatch(r"sha256:[a-f0-9]{64}", asset.get("digest", "")):
        raise ValueError("The latest APK has no verified SHA-256")
    size = asset.get("size")
    if not isinstance(size, int) or not 0 < size <= MAX_SIZE:
        raise ValueError("The latest APK size is invalid")
    url = urllib.parse.urlparse(asset.get("browser_download_url", ""))
    if (
        url.scheme != "https"
        or url.netloc != "github.com"
        or not url.path.startswith(f"/{REPOSITORY}/releases/download/")
        or not url.path.endswith("/" + asset["name"])
        or url.query
        or url.fragment
    ):
        raise ValueError("Unexpected public APK URL")
    return build, asset


def write_payload(directory, release, stream):
    build, asset = choose_asset(release)
    apk_directory = directory / "apk"
    apk_directory.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha256()
    total = 0
    chunks = []
    while True:
        data = stream.read(CHUNK_SIZE)
        if not data:
            break
        # HTTP streams may return short reads. Fill each published part.
        while len(data) < CHUNK_SIZE:
            more = stream.read(CHUNK_SIZE - len(data))
            if not more:
                break
            data += more
        total += len(data)
        if total > asset["size"]:
            raise ValueError("APK download exceeds the release size")
        digest.update(data)
        name = f"part-{len(chunks):03d}.bin"
        (apk_directory / name).write_bytes(data)
        chunks.append({"path": f"apk/{name}", "size": len(data)})
    if total != asset["size"] or "sha256:" + digest.hexdigest() != asset["digest"]:
        raise ValueError("APK checksum or size does not match the public release")
    manifest = {
        "build": build,
        "release": release["tag_name"],
        "size": total,
        "sha256": digest.hexdigest(),
        "chunks": chunks,
    }
    (directory / "release.json").write_text(
        json.dumps(manifest, separators=(",", ":")), encoding="utf-8"
    )
    print(f"Prepared Companion build {build}, {total} bytes, {len(chunks)} parts")


def main():
    directory = Path(sys.argv[1]).resolve()
    if not (directory / "index.html").is_file():
        raise ValueError("Build the USB setup page before preparing its APK")
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = "Bearer " + token
    request = urllib.request.Request(
        f"https://api.github.com/repos/{REPOSITORY}/releases/latest",
        headers=headers,
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        release = json.load(response)
    _, asset = choose_asset(release)
    # This public download never receives the API authorization header.
    request = urllib.request.Request(
        asset["browser_download_url"], headers={"Accept-Encoding": "identity"}
    )
    with urllib.request.urlopen(request, timeout=300) as response:
        final = urllib.parse.urlparse(response.geturl())
        if final.scheme != "https" or final.hostname not in {
            "github.com",
            "release-assets.githubusercontent.com",
            "objects.githubusercontent.com",
            "github-releases.githubusercontent.com",
        }:
            raise ValueError("Unexpected APK download host")
        write_payload(directory, release, response)


if __name__ == "__main__":
    main()
