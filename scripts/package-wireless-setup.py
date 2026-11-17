"""Package the two reviewed setup scripts, without SDKs, APKs or credentials."""

import sys
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parent.parent
output = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "artifacts/waalid-kaab-wireless-setup.zip"
output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    for name in ("setup-managed-wireless.ps1", "setup-managed-usb.ps1"):
        archive.write(root / "scripts" / name, name)
print(f"Wireless setup kit: {output}")
