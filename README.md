# Waalid Kaab Android releases

Latest release: [Waalid Kaab 2.14.1](https://github.com/hogaamiye/Waalid-Kaab-Release/releases/tag/v2.14.1).

- [Parent 2.14.0 - build 53](https://github.com/hogaamiye/Waalid-Kaab-Release/releases/download/v2.14.1/waalid-kaab-parent-build-53.apk)
- [Companion 2.14.1 - build 55](https://github.com/hogaamiye/Waalid-Kaab-Release/releases/download/v2.14.1/waalid-kaab-companion-build-55.apk)
- [Online USB setup](https://hogaamiye.github.io/Waalid-Kaab-Release/)

Companion 2.14.1 (build 55) adds first-launch invitation capture. On the updated family connection page, tap Download and connect, allow clipboard access, install and tap Open. An unpaired Companion recognizes the private, expiring invitation and opens the supervision consent screen. Child consent and parent approval remain required. If clipboard access is blocked or the invitation expires, use Open Companion and connect or ask for a fresh invitation. Parent stays at 2.14.0 (build 53), unchanged.

Deploy the matching private backend update to enable the new download page. Preserve the hosted .env, APP_KEY, database and uploads, then run php artisan migrate --force and php artisan optimize:clear. No new environment keys are required. Backend files are not included here.

Managed QR enrollment, standard setup links and USB/wireless computer setup remain available. Standard APK installation alone does not grant Device Owner. Physical Samsung first-launch capture still needs validation. This release does not claim to fix the reported package-parsing error.

Check an APK locally on your phone at https://hogaamiye.github.io/Waalid-Kaab-Release/apk-check.html; no file is uploaded.

Install over existing apps without uninstalling. Parent 2.8.1 and 2.9.0 require a one-time manual Parent APK installation to receive the automatic checker. Later versions check for updates automatically; Android may require installation confirmation.

Open online USB setup in desktop Chrome or Edge on the computer connected to the phone. No local ADB folder or setup script is required. Enable USB debugging and approve access on the phone. Windows may require the manufacturer's USB driver.

USB protection is opt-in on supported Android 12+ Device Owner phones. Open Companion > Removal protection > USB protection & maintenance and confirm with the parent PIN. Charging remains available. Parent-authorized maintenance can temporarily allow computer access; close it when finished. Android may delay background expiry work. USB policy does not control recovery or firmware service modes.

The Parent app shows reported USB protection state and configurable missing-report alerts. These features require the matching private backend update and migrations. Keep the server scheduler and queue worker running. Missing reports can result from loss of power or connectivity and do not prove tampering.

Quran practice includes Surah, From ayah and To ayah selection, learning plans and revision tools.

Graduation academy adds administrator-managed cohorts, PDF and image uploads, AI-generated reading and questions, reviewed study packs, practice and timed mocks, and optional parent progress access. Puntland, Somalia is the default. Deploy the matching private backend update and migrations before using the module. AI generation uses the existing OpenAI study settings and study-ai worker; API charges apply. Practice scores are not official examination grades.

Preserve the server's .env and APP_KEY when deploying backend updates. Backend source, credentials and signing keys are not published here. Signed APKs are attached under Releases; this repository contains the public release index and browser USB setup tools.