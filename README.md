# Waalid Kaab Android releases

Latest release: [Waalid Kaab 2.8.3](https://github.com/hogaamiye/Waalid-Kaab-Release/releases/tag/v2.8.3).

- [Parent 2.8.3 - build 45](https://github.com/hogaamiye/Waalid-Kaab-Release/releases/download/v2.8.3/waalid-kaab-parent-build-45.apk)
- [Companion 2.8.3 - build 49](https://github.com/hogaamiye/Waalid-Kaab-Release/releases/download/v2.8.3/waalid-kaab-companion-build-49.apk)
- [Online USB setup](https://hogaamiye.github.io/Waalid-Kaab-Release/)

Open online USB setup in desktop Chrome or Edge on the computer connected to the phone. No local ADB folder or setup script is required. Enable USB debugging and approve access on the phone. Windows may require the manufacturer's USB driver.

USB protection is opt-in on supported Android 12+ Device Owner phones. Open Companion > Removal protection > USB protection & maintenance and confirm with the parent PIN. Charging remains available. Parent-authorized maintenance can temporarily allow computer access; close it when finished. Android may delay background expiry work. USB policy does not control recovery or firmware service modes.

The Parent app shows reported USB protection state and configurable missing-report alerts. These features require the matching private backend update and migrations. Keep the server scheduler and queue worker running. Missing reports can result from loss of power or connectivity and do not prove tampering.

Quran practice includes Surah, From ayah and To ayah selection, learning plans and revision tools.

Preserve the server's .env and APP_KEY when deploying backend updates. Backend source, credentials and signing keys are not published here. Signed APKs are attached under Releases; this repository contains the public release index and browser USB setup tools.