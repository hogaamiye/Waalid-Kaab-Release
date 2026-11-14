# Waalid Kaab Android releases

Latest release: [Waalid Kaab 2.10.0](https://github.com/hogaamiye/Waalid-Kaab-Release/releases/tag/v2.10.0).

- [Parent 2.10.0 - build 48](https://github.com/hogaamiye/Waalid-Kaab-Release/releases/download/v2.10.0/waalid-kaab-parent-build-48.apk)
- [Companion 2.10.0 - build 52](https://github.com/hogaamiye/Waalid-Kaab-Release/releases/download/v2.10.0/waalid-kaab-companion-build-52.apk)
- [Online USB setup](https://hogaamiye.github.io/Waalid-Kaab-Release/)

Parent 2.10.0 (build 48) fixes the automatic-update checker missing from Parent 2.8.1 and 2.9.0. Install the new Parent APK over the existing app once; do not uninstall. Future checks run automatically and App & server updates includes Check for updates now. Android may still require installation permission and confirmation. Companion 2.10.0 (build 52) adds Graduation academy access from the protected Focus Space and app-lock screens while preserving the lock policy.

The matching private backend update adds a searchable active Companion student dropdown for administrator assignment. Search by student or family name; archived profiles are excluded and existing assignments are marked. Deploy the backend package and run php artisan optimize:clear, then refresh the admin page.

Version 2.10.0 adds Brain practice, optional parent-enabled physical activity AI summaries, supported-device step counting and parent-approved rewards. Temporary app clips and frames are deleted after processing or expiry; provider retention rules apply. Graduation academy adds saved answers, revision tools and administrator-controlled attempt limits. Deploy the matching private backend package and run migrations, clear configuration caches and restart the study-ai worker. Keep the scheduler running. No new environment entries are required.

Open online USB setup in desktop Chrome or Edge on the computer connected to the phone. No local ADB folder or setup script is required. Enable USB debugging and approve access on the phone. Windows may require the manufacturer's USB driver.

USB protection is opt-in on supported Android 12+ Device Owner phones. Open Companion > Removal protection > USB protection & maintenance and confirm with the parent PIN. Charging remains available. Parent-authorized maintenance can temporarily allow computer access; close it when finished. Android may delay background expiry work. USB policy does not control recovery or firmware service modes.

The Parent app shows reported USB protection state and configurable missing-report alerts. These features require the matching private backend update and migrations. Keep the server scheduler and queue worker running. Missing reports can result from loss of power or connectivity and do not prove tampering.

Quran practice includes Surah, From ayah and To ayah selection, learning plans and revision tools.

Graduation academy adds administrator-managed cohorts, PDF and image uploads, AI-generated reading and questions, reviewed study packs, practice and timed mocks, and optional parent progress access. Puntland, Somalia is the default. Deploy the matching private backend update and migrations before using the module. AI generation uses the existing OpenAI study settings and study-ai worker; API charges apply. Practice scores are not official examination grades.

Preserve the server's .env and APP_KEY when deploying backend updates. Backend source, credentials and signing keys are not published here. Signed APKs are attached under Releases; this repository contains the public release index and browser USB setup tools.