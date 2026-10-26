# Ivy Clinics — demo platform

One brand, one app: **Ivy Clinics** books medical aesthetic treatments at four clinics, runs reformer
pilates classes and sells skincare in a webshop. (Pure, the pilates studio, is part of Ivy Clinics.)
This is a demo with test data only: fictional clients, schedules and specialists, and no real payments.
Treatments, starting prices, locations, opening hours and the webshop products and prices follow
ivyclinics.nl (October 2026).

- Design canvas: https://claude.ai/artifact/UrYoLqDJGxQNyCYbxrqw34 (private, share it from the canvas' Share menu)

## Structure

```
apps/mobile/       Expo (SDK 58) member app, Expo Router
apps/admin/        Admin panel (Vite, React, Three.js): the four clinics and the pilates studio live in 3D, plus the webshop
packages/shared/   languages (nl, en, ar, fr, de, it), formatting, brand data and demo data (treatments,
                   pilates classes, webshop products)
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
Five tabs: Home, Boeken (treatments), Pilates, Shop and Mijn Ivy (everything planned or bought).
All payments are iDEAL test payments; Instellingen → "Demo opnieuw beginnen" resets the demo data.

## Languages

Dutch is the source language. English, Arabic (right to left), French, German and Italian live in
`packages/shared/src/i18n/messages/`; every file must provide the same keys as `nl.ts`.

In the app, switch language under Instellingen (the person icon). A link can also open a screen in a
language, e.g. `exp://<your-ip>:8081/--/ivy?lang=ar` in Expo Go.

## Photos

The photos in `apps/mobile/assets/photos/` come from Unsplash under the Unsplash License
(free for commercial use). Sources are listed in `apps/mobile/assets/photos/CREDITS.md`.
Replace them with the studios' own photography before going live.
