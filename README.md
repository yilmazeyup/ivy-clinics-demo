# Pure Clinics — demo platform

One app for **Pure Clinics**, the skin clinic in Nijmegen and Uden: free intakes, skin therapy and
permanent hair removal by skin therapists, Blanche Beauty Studio (brows, lashes, nails) and the
aftercare webshop. This is a demo with test data only: fictional clients, schedules and specialists,
and no real payments. Treatments, prices, deals, locations and opening hours follow pureclinics.nl
(October 2026).

- Live demo: https://yilmazeyup.github.io/pure-clinics-demo/ (the app and the admin panel, in Dutch, English, Arabic, French, German and Italian)
- Help page with a Dutch explainer video (subtitles in Dutch and English) and common questions: https://yilmazeyup.github.io/pure-clinics-demo/hulp/
- Design canvas: https://claude.ai/artifact/UrYoLqDJGxQNyCYbxrqw34 (private, share it from the canvas' Share menu)

## Structure

```
apps/mobile/       Expo (SDK 58) member app, Expo Router
apps/admin/        Admin panel (Vite, React, Three.js): both clinics live in 3D, the day's agenda, treatment series, the webshop and a guided tour
packages/shared/   languages (nl, en, ar, fr, de, it), formatting, brand data and demo data (treatments and
                   their details, laser zones, deals, webshop products)
```

## Run

```bash
npm install
npm run ios
```

The admin panel has its own install, outside the npm workspaces: npm 10 crashes while resolving
Vite 8's optional peer dependencies inside the workspace, so `apps/admin/.npmrc` turns automatic
peer installs off and `@pure-ivy/shared` is linked with `file:`.

```bash
npm --prefix apps/admin install
npm run admin
```

It opens on http://localhost:5180. "Speel de dag af" runs today from 07:00 to 22:00 in about 45 seconds.

`npm --prefix apps/admin run artifact -- <file.html>` builds the panel as one page for a claude.ai
Artifact: the app's code and CSS inline, React 18 from cdnjs and Three.js from jsDelivr.
The shared demo link is https://claude.ai/artifact/BV2dcK2GQYRmrSjhoSbvam (private until shared).

## Testing the member app

`npm run mobile` starts the app; open it in Expo Go on an iPhone, or press `i` for the iOS simulator.
Four tabs: Home, Boeken (treatments), Shop and Mijn Pure (appointments, orders, membership and contact).
All payments are iDEAL test payments; Instellingen → "Demo opnieuw beginnen" resets the demo data.

## Languages

Dutch is the source language. English, Arabic (right to left), French, German and Italian live in
`packages/shared/src/i18n/messages/`; every file must provide the same keys as `nl.ts`.

In the app, switch language under Instellingen (the person icon). A link can also open a screen in a
language, e.g. `exp://<your-ip>:8081/--/?lang=ar` in Expo Go.

## Photos

Most photos in `apps/mobile/assets/photos/` are Pure Clinics' own, from pureclinics.nl: treatment photos (`pc-*`)
and before-and-after pictures with the clinic's VOOR/NA labels (`ba-*`). A few product textures still come from
Unsplash. Sources are listed in `apps/mobile/assets/photos/CREDITS.md`.
