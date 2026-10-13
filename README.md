# Laminator's Catalyst Calculator

An installable web app (PWA). It works offline once it has been opened, installs to a phone's home screen like a normal app, and needs no app store.

## Put it online (free, about five minutes)

1. On a computer, unzip this folder.
2. Go to https://app.netlify.com/drop and sign up for a free account.
3. Drag the whole unzipped folder onto the page.
4. Netlify gives you a web address like `something-random.netlify.app`. That is your app.
5. In Netlify's site settings you can rename it, for example `catalyst-calc.netlify.app`, or attach your own domain later.

Cloudflare Pages and GitHub Pages work the same way if you prefer them. The app needs HTTPS to install, and all three provide it automatically.

## Install it on a phone

- iPhone: open the address in Safari, tap Share, then "Add to Home Screen".
- Android: open the address in Chrome, then tap "Install app" (or the menu, then "Add to Home screen").

Once it has been opened once, it works with no signal.

## Updating it

1. Change the files.
2. Open `sw.js` and bump the version at the top, for example `catalyst-v1` to `catalyst-v2`. Skip this and phones keep the old copy.
3. Drag the folder onto Netlify again (Deploys tab, drag and drop).

Phones pick up the new version the next time the app is opened with a connection.

## What is in the folder

- `index.html`: the whole app.
- `manifest.webmanifest`: name, colours and icons, so phones can install it.
- `sw.js`: the offline worker.
- `icons/`: app icons.
- `fonts/`: the three typefaces, bundled so the app looks right offline. All are under the SIL Open Font License (licences included), which allows bundling them in a commercial app.

## Before you sell it

- Replace estimated figures with real TDS data where you can.
- Add terms of use and a disclaimer page, and talk to an insurer about product liability cover.
- Payments: a licence key sold through Lemon Squeezy or Gumroad is the simplest start. The app stores come later, by wrapping this same folder with Capacitor.
