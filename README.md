# Waalid Kaab Android releases

Latest release: [Waalid Kaab 2.14.0](https://github.com/hogaamiye/Waalid-Kaab-Release/releases/tag/v2.14.0).

- [Parent 2.14.0 - build 53](https://github.com/hogaamiye/Waalid-Kaab-Release/releases/download/v2.14.0/waalid-kaab-parent-build-53.apk)
- [Companion 2.14.0 - build 54](https://github.com/hogaamiye/Waalid-Kaab-Release/releases/download/v2.14.0/waalid-kaab-companion-build-54.apk)
- [Online USB setup](https://hogaamiye.github.io/Waalid-Kaab-Release/)

Parent and Companion 2.14.0 add managed QR enrollment without a computer. In Parent, open Connect child phone -> Choose setup -> Managed setup (new or reset phone). Back up important data before a reset. On compatible new or already factory-reset Android 8+ phones, use Android's initial-setup scanner to scan the parent QR, connect to Wi-Fi and accept management setup. Android downloads the checksum-pinned APK and grants Device Owner only if provisioning succeeds. Companion carries the private, one-hour invitation into the visible consent and parent-approval flow. The app does not reset phones. Verify Device Owner active in Companion Protection checks. Full provisioning still needs physical-device validation.

Standard setup links combine the latest APK download and the family invitation. After installing, return to the invitation page and tap Open Companion and connect. Standard installation keeps existing data and does not grant Device Owner.

The setup page also offers a Windows wireless ADB kit for eligible Android 11+ phones on the same Wi-Fi. It verifies the APK and reads back Device Owner state. Existing USB setup remains available.

Deploy the matching private backend package, preserve the hosted .env, APP_KEY, database and uploads, then run php artisan migrate --force and php artisan optimize:clear. Managed QR generation needs an HTTPS APP_URL and published Companion build 54 or newer. No new environment keys are required for managed setup. Existing Twilio/Firebase configuration remains private on the backend.

Install over existing apps without uninstalling. Parent 2.8.1 and 2.9.0 require a one-time manual Parent APK installation to receive the automatic checker. Later versions check for updates automatically; Android may require installation confirmation.

Open online USB setup in desktop Chrome or Edge on the computer connected to the phone. No local ADB folder or setup script is required. Enable USB debugging and approve access on the phone. Windows may require the manufacturer's USB driver.

USB protection is opt-in on supported Android 12+ Device Owner phones. Open Companion > Removal protection > USB protection & maintenance and confirm with the parent PIN. Charging remains available. Parent-authorized maintenance can temporarily allow computer access; close it when finished. Android may delay background expiry work. USB policy does not control recovery or firmware service modes.

The Parent app shows reported USB protection state and configurable missing-report alerts. These features require the matching private backend update and migrations. Keep the server scheduler and queue worker running. Missing reports can result from loss of power or connectivity and do not prove tampering.

Quran practice includes Surah, From ayah and To ayah selection, learning plans and revision tools.

Graduation academy adds administrator-managed cohorts, PDF and image uploads, AI-generated reading and questions, reviewed study packs, practice and timed mocks, and optional parent progress access. Puntland, Somalia is the default. Deploy the matching private backend update and migrations before using the module. AI generation uses the existing OpenAI study settings and study-ai worker; API charges apply. Practice scores are not official examination grades.

Preserve the server's .env and APP_KEY when deploying backend updates. Backend source, credentials and signing keys are not published here. Signed APKs are attached under Releases; this repository contains the public release index and browser USB setup tools.