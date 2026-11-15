# Waalid Kaab Android releases

Latest release: [Waalid Kaab 2.13.0](https://github.com/hogaamiye/Waalid-Kaab-Release/releases/tag/v2.13.0).

- [Parent 2.13.0 - build 52](https://github.com/hogaamiye/Waalid-Kaab-Release/releases/download/v2.13.0/waalid-kaab-parent-build-52.apk)
- [Companion 2.12.0 - build 53](https://github.com/hogaamiye/Waalid-Kaab-Release/releases/download/v2.13.0/waalid-kaab-companion-build-53.apk)
- [Online USB setup](https://hogaamiye.github.io/Waalid-Kaab-Release/)

Parent 2.13.0 adds Twilio Verify SMS phone sign-in, signup, linking and verified-phone checkmarks. Email is optional. Existing verified Firebase accounts retain their account and family data. Six-digit manual entry and Android SMS autofill are supported where available. Companion remains 2.12.0 (build 53), unchanged.

Deploy the matching private backend package first. Run php artisan migrate --force and php artisan optimize:clear. Configure PHONE_AUTH_PROVIDER=twilio, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_VERIFY_SERVICE_SID privately on the server. Use a funded six-digit SMS Verify service with Somalia enabled in Verify Geo Permissions. Real SMS testing awaits credentials. Backend source and credentials are not included here.

Install over existing apps without uninstalling. Parent 2.8.1 and 2.9.0 require a one-time manual Parent APK installation to receive the automatic checker. Later versions check for updates automatically; Android may require installation confirmation.

Open online USB setup in desktop Chrome or Edge on the computer connected to the phone. No local ADB folder or setup script is required. Enable USB debugging and approve access on the phone. Windows may require the manufacturer's USB driver.

USB protection is opt-in on supported Android 12+ Device Owner phones. Open Companion > Removal protection > USB protection & maintenance and confirm with the parent PIN. Charging remains available. Parent-authorized maintenance can temporarily allow computer access; close it when finished. Android may delay background expiry work. USB policy does not control recovery or firmware service modes.

The Parent app shows reported USB protection state and configurable missing-report alerts. These features require the matching private backend update and migrations. Keep the server scheduler and queue worker running. Missing reports can result from loss of power or connectivity and do not prove tampering.

Quran practice includes Surah, From ayah and To ayah selection, learning plans and revision tools.

Graduation academy adds administrator-managed cohorts, PDF and image uploads, AI-generated reading and questions, reviewed study packs, practice and timed mocks, and optional parent progress access. Puntland, Somalia is the default. Deploy the matching private backend update and migrations before using the module. AI generation uses the existing OpenAI study settings and study-ai worker; API charges apply. Practice scores are not official examination grades.

Preserve the server's .env and APP_KEY when deploying backend updates. Backend source, credentials and signing keys are not published here. Signed APKs are attached under Releases; this repository contains the public release index and browser USB setup tools.