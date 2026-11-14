# Waalid Kaab Android releases

Latest release: [Waalid Kaab 2.9.0](https://github.com/hogaamiye/Waalid-Kaab-Release/releases/tag/v2.9.0).

- [Parent 2.9.0 - build 46](https://github.com/hogaamiye/Waalid-Kaab-Release/releases/download/v2.9.0/waalid-kaab-parent-build-46.apk)
- [Companion 2.9.0 - build 50](https://github.com/hogaamiye/Waalid-Kaab-Release/releases/download/v2.9.0/waalid-kaab-companion-build-50.apk)
- [Online USB setup](https://hogaamiye.github.io/Waalid-Kaab-Release/)

Open online USB setup in desktop Chrome or Edge on the computer connected to the phone. No local ADB folder or setup script is required. Enable USB debugging and approve access on the phone. Windows may require the manufacturer's USB driver.

USB protection is opt-in on supported Android 12+ Device Owner phones. Open Companion > Removal protection > USB protection & maintenance and confirm with the parent PIN. Charging remains available. Parent-authorized maintenance can temporarily allow computer access; close it when finished. Android may delay background expiry work. USB policy does not control recovery or firmware service modes.

The Parent app shows reported USB protection state and configurable missing-report alerts. These features require the matching private backend update and migrations. Keep the server scheduler and queue worker running. Missing reports can result from loss of power or connectivity and do not prove tampering.

Quran practice includes Surah, From ayah and To ayah selection, learning plans and revision tools.

Graduation academy adds administrator-managed cohorts, PDF and image uploads, AI-generated reading and questions, reviewed study packs, practice and timed mocks, and optional parent progress access. Puntland, Somalia is the default. Deploy the matching private backend update and migrations before using the module. AI generation uses the existing OpenAI study settings and study-ai worker; API charges apply. Practice scores are not official examination grades.

Preserve the server's .env and APP_KEY when deploying backend updates. Backend source, credentials and signing keys are not published here. Signed APKs are attached under Releases; this repository contains the public release index and browser USB setup tools.