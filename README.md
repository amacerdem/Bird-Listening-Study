# Bird Listening Study

Bilingual Turkish and English participant study for Musical Intelligence.
Live study: **https://r3-resonance.com/**. Researcher: Amaç Erdem.

One blackbird phrase produces six transformations. Participants first listen to
full transformation, flute, piano, spectrum, pitch and timing, in that order.
They may replay clips and give each a 0–10 difference rating. They then provide
0–1 responses while audio time advances automatically, in separate calming
quality, pleasantness and arousal rounds (18 trials).

The application includes consent, verified email registration, a short profile,
audio setup, slider practice, interruption handling, local resume, private server
submission and analysis export. It does not show model predictions to participants.

## Run locally

Use Node.js 22 or later:

```sh
npm ci
npm test
npm run dev
```

Open `http://127.0.0.1:8817/?preview=1`. Preview mode shortens playback for interface
checks and cannot submit participant data. The local static server does not supply
Identity or the response API. Real participation requires the configured Netlify
site; use its normal URL without the preview query.

## Build and deploy

```sh
npm run build
```

`dist/` contains the root participant page, six frozen WAV files, bilingual email
templates and the preserved MI-STM interface at `/mi-stm/`. `netlify.toml` defines
static publishing and the server function. Do not publish static files alone if
you need registration and response storage.

For Netlify:

1. Use this repository with the supplied `netlify.toml` and Node.js 22.
2. Set `BIRD_STUDY_ORIGIN=https://r3-resonance.com` for **both Builds and Functions**.
3. Enable Netlify Identity with email confirmation required and signups open.
4. Set the confirmation email template to `/confirmation-email.html` and recovery
   template to `/recovery-email.html`. Both return to the canonical study origin.
5. Test actual confirmation, sign-in and private response storage before recruitment.

A different domain needs the matching environment value before building and
publishing. Never trust a client-supplied Identity origin. Provider usage limits
apply. This repository push does not connect GitHub to automatic Netlify deploys;
the existing live release remains unchanged.

For the existing manual deployment pipeline, `npm run build:functions` additionally
creates `.build/functions/bird-response.zip` and its manifest. Use runtime API v2
and streaming invocation. The deployment receipts in `docs/deployment/` describe
the previously verified production release, not a new release from this commit.

## Audio reproducibility

`stimuli/stimuli.json` pins each WAV by SHA-256. All clips are 22.049796 seconds,
44.1 kHz, mono, 16-bit PCM. Nine complete phrases use morph amounts 0, 0.125,
0.25, 0.375, 0.5, 0.625, 0.75, 0.875 and 1. This is a stepwise sweep.

`npm run build:audio` regenerates audio using the included renderers and source
samples. Normal builds reuse the frozen WAVs. Compare every regenerated hash to
the committed manifest before using it in the current protocol; version any
stimulus changes before a new cohort. Equal RMS is not equal perceived loudness.

## Private data

The Netlify function checks the verified session, origin, complete protocol and
exact stimulus identities. It stores contact details in `bird-study-contacts-v1`
and coded responses in `bird-study-responses-v1`. Only one submission per verified
account and protocol is accepted. Retries return the existing receipt.

The R3 and musicalintelligence.app instances have separate accounts and stores.
Do not combine cohorts without retaining their site origin. No participant
records, passwords, access tokens or provider keys belong in this repository.

Download private response records through authorized Netlify Blobs access, keep
them outside the repository (or in ignored `private-data/`), then run:

```sh
node scripts/export-responses.mjs private-data/responses.json analysis-output
```

The exporter removes QA/preview records, duplicates and incomplete sessions.
Contact details are not part of the response CSVs. Honor withdrawal requests and
the contact-retention promise in the study consent. Private export access remains
with the study owner.

## Files

- `src/`: participant UI, protocol, profile validation and audio renderers.
- `functions/`: authenticated private response endpoint.
- `stimuli/`: frozen rendered study audio and provenance manifest.
- `stimulus-source/`: source phrase and licensed instrument samples.
- `scripts/`: build, audio rendering, local preview and analysis export.
- `tests/`: protocol, integrity, profile and authentication checks.
- `public/mi-stm/`: previous R3 interface, preserved independently of the study.
- `docs/`: protocol and deployment records.

The implementation reference in `docs/implementation-reference.md` describes the
original MI-App integration. Paths under `output/` there refer to that historical
layout; this repository uses `stimuli/`, `dist/` and `.build/` as described above.

This is a controlled single-source listening study. It measures reported
perception and affect; it does not demonstrate therapeutic efficacy, physiological
stress reduction or generalization across birdsongs. TAR comparisons require a
prespecified analysis and model outputs matched to the exact presented audio.
