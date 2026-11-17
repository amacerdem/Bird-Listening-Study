# Bird listening study

Participant route: `/experiments/birdsong-study/`. Turkish and English. This
standalone app uses the existing Netlify site, Identity and private Blobs stores.
It does not replace the computational research explorer.

## Protocol

Version `bird-listening-2026-11-17-v1` implements the agreed Bird v4 flow:
consent, email verification, a brief participant profile, comfortable-volume and stereo-channel check, six-second slider practice,
one full presentation of each transformation, optional replay with six 0–10
difference ratings, then calming quality, pleasantness and arousal in separate
rounds. Every round presents full, flute, piano, spectrum, pitch, time in that
order. Zero is a valid difference rating. No model prediction is shown.

The two-channel identification is an equipment/setup check, not a validated
headphone exclusion instrument. The participant also confirms headphone use.
The page does not claim ethics approval, clinical measurement or human validation.

## Audio specification

`scripts/render-audio.ts` imports the existing bird, flute and piano renderers.
The same source blackbird phrase and original instrument samples are used.
Each clip consists of nine complete phrases at morph values 0, .125, .25, .375,
.5, .625, .75, .875 and 1. Each anchor lasts 2.449977 seconds. The first and last
anchors provide equal endpoint holds. This is a stepwise controlled sweep, not
continuous interpolation of acoustic parameters. All six clips have the same
22.049796-second duration, 44.1 kHz mono PCM, 5 ms phrase-edge tapers and equal
RMS per anchor with one common peak-safety gain. Equal RMS does not imply equal
perceived loudness. Browser resampling and the chosen playback gain are logged.

Full jointly changes pitch, timing and spectrum. Flute and piano each begin at
the synthetic transcription. Isolated spectrum, pitch and timing each begin
at the bird. Instrument morphs also change the envelope and are not isolated
timbre manipulations. Audio SHA-256 values, source provenance and credits are in
`stimuli.json`; all participant records identify the exact rendered clip.

## Timing and interruptions

Playback is scheduled on the Web Audio clock. The chart's horizontal position
follows this clock; pointer and keyboard input only change the vertical value.
A participant must explicitly choose a starting value. Actual sample times,
responses and morph values are recorded at approximately 20 Hz, not reconstructed
later as uniformly timed samples. Keyboard arrows, Home/End and touch are supported.
Hiding the tab or stopping playback invalidates that attempt and requires a full
restart. Completed trials are checkpointed in local storage. Interrupted attempts
are retained separately. Incomplete sessions cannot be submitted.

`?preview=1` visibly labels a preview session, shortens experimental playback for
interface review and disables submission. Preview records must never enter analysis.
The normal participant route always plays complete clips. The source phrase,
stimulus hashes and browser playback gains remain reproducible.

## Registration and collection

Netlify Identity provides email verification without an additional mail provider.
The UI asks only for an email; the initial Identity account receives a random,
unrecorded high-entropy password. Participants never need to choose a password.
Existing accounts receive a one-time recovery/sign-in link. Both confirmation and
recovery templates are bilingual and return directly to the participant route.
Identity handles email throttling and token validity. Its account limits and the
site's existing hosting allowance apply; this is not unlimited free infrastructure.

After consent and verification, a one-minute profile asks for optional preferred
name, age range, native language, musical training, music-making frequency and
listening comfort. Personal-choice questions include “prefer not to say”. No
medical detail, exact birth date, address or telephone number is requested.

`functions/bird-response.mjs` independently verifies the Identity session against
the provider before accepting data. It validates the protocol, complete trials,
exact audio hashes and durations, profile and consent. It checks the request origin.
Only one submission per verified account and protocol is accepted; retries return
the existing server receipt. Preview/shortened audio cannot pass these checks.

The private `bird-study-contacts-v1` store contains email, optional name, verification
time and participant-code mapping. `bird-study-responses-v1` contains coded profile,
ratings and timestamped traces, without direct contact information or Identity ID
inside the analysis record. Store keys are provider user IDs under the protocol
namespace; they are available only through authenticated owner access. The public
function has no list/read-response endpoint. GET returns only whether the caller's
own email session is verified. No access keys are shipped in the browser bundle.

The owner can download records under Netlify → Data & Storage → Blobs. The analysis
exporter accepts a downloaded response record, an array of records, or a participant's
local JSON download:

```
node scripts/export-responses.mjs submissions.json analysis-output
```

It excludes QA/preview records, duplicates and incomplete sessions, exporting
ratings and timestamped traces separately with an import audit. Contact data is not
included in participant response downloads or analysis CSVs. Use the matching
participant code for authorized withdrawal requests. At study closure, manually
remove contact mappings, Identity accounts and any exported contact copies as
promised in the consent notice. Never put private exports into the site/repository.

The researcher should use the participant route directly for recruitment. Showing
the computational explorer first could expose participants to model predictions.

## Analysis boundary

The published TAR results use complete-phrase model runs at fixed anchors. Do not
treat those stored curves as continuous inference on the participant's concatenated
stimulus. Endpoint/anchor comparisons can be specified in advance; for time-resolved
TAR comparisons rerun the frozen MI engine on the exact heard WAVs, with the declared
playback-level convention and a predeclared response-lag analysis. Fixed order and
participant-controlled replay must be retained in the interpretation. This single
source is suitable for a controlled pilot; it does not establish generalization.

## Build and verification

The build uses the existing workspace's esbuild installation. Run `node scripts/build.mjs
--audio` to regenerate audio, or omit `--audio` for interface-only edits. Run
`node --test tests/*.test.mjs` after building. No other site source is rebuilt.
Keep stimulus/protocol changes versioned before recruiting a new study cohort.

Documentation: https://docs.netlify.com/manage/forms/setup/ and
https://docs.netlify.com/manage/forms/submissions/.

Production deployment includes `output/functions/bird-response.zip` alongside the
static files, with runtime API version 2 and streaming invocation. The verified
function bundle and its deployment metadata are archived in
`provenance/releases/2026-11-17-bird-listening-study/`. Publishing only `site/` does
not deploy this response backend. The existing pre-registration form is unchanged.


## R3 deployment

The same participant app is also published at https://r3-resonance.com/.
Build the root route with:

```sh
node scripts/build.mjs --origin=https://r3-resonance.com --base=/ --output=output-r3
```

This build reuses the frozen study WAVs. Set the function environment variable
`BIRD_STUDY_ORIGIN=https://r3-resonance.com` in its Netlify deployment so server
verification uses this site's own Identity service. Configure confirmation and
recovery templates at `/confirmation-email.html` and `/recovery-email.html`.
The build embeds the canonical origin in email links.

R3 has separate Identity users and private response/contact stores. Records are
not automatically combined with the musicalintelligence.app cohort. Preserve the
site origin when aggregating exports. The former R3 MI-STM site is retained at
`/mi-stm/`. Release receipts and checks are in
`provenance/releases/2026-11-17-r3-bird-study/`; the repository `site/` snapshot
continues to represent musicalintelligence.app, not R3.
