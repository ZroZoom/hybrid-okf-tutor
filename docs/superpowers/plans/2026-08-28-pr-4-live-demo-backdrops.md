# PR #4 Live Demo Backdrops Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn PR #4 into an honest, rehearsable 60-second Polish live-demo package with seven consistent 16:9 backdrops and no generated audio.

**Architecture:** Treat the pull request script as the single source of narration and timing, then render a repository-contained storyboard from seven deterministic SVG scene files. Use generated illustration only for the opening and closing bookends; compose every Polish label and product UI as vector text so spelling and claims remain reviewable. Mark implemented P0 behavior separately from Phase 2 or roadmap concepts.

**Tech Stack:** Markdown, JSON, SVG, vanilla HTML/CSS/JavaScript, image generation for two text-free illustration backgrounds, Chrome for visual review.

**Spec:** `docs/demo/demo-script.md` from PR #4 at head `21adf2a3a01013c4cf6c88967a9a9374f0a60625`; scope authority remains `docs/spec/hybrid-okf-tutor-hackathon-spec.md` and `docs/plans/2026-08-28-implementation-plan.md` on `main`.

## Global Constraints

- This is a live presentation. Generate no audio, voice-over, synthetic voice, captions timed as speech, or TTS files.
- Total scene duration is exactly 60 seconds; the presenter speaks Polish live and uses the script as talking points rather than reading mechanically.
- Label Phase 2 and unimplemented behavior with the visible ribbon `ROADMAP / KONCEPCJA`; do not present it as a working P0 feature.
- P0 may claim only natural-language intent interpretation, ambiguity clarification, controlled OKF lookup, deterministic response composition, and emotional-signal classification from the student's text.
- The spoken phrase `działający rdzeń` is allowed only after the exact deployed demo passes the three-flow verification in Task 6. Before that gate, use the fallback phrase `rdzeń, który budujemy` and do not imply current availability.
- Do not claim camera, gaze, face, or attention tracking. A future behavioral-signal scene may show a tab switch only under the `ROADMAP / KONCEPCJA` ribbon.
- Never label draft or pending OKF knowledge as verified. The exact badge is `OKF • DEV / WIEDZA NIEZWERYFIKOWANA` until live data is published.
- Generate no identifiable real student data. Student figures are fictional illustrations and contain no real names, accounts, chat histories, invoices, or personal identifiers.
- Every scene uses `viewBox="0 0 1920 1080"`, a 16:9 canvas, a light theme, navy `#16233A`, green `#2E8B68`, amber `#D98B2B`, warm red `#C95A4A`, and the system-font stack `Inter, ui-sans-serif, system-ui, sans-serif`.
- All Polish on-screen copy is vector text authored in the SVG or HTML. Do not ask an image model to render UI labels.
- The package must work locally from files without API keys, network access, a running application, or student data.

## File Map

- Modify: `docs/demo/demo-script.md` — authoritative narration, timings, scope labels, and scene-to-asset references.
- Create: `docs/demo/README.md` — presenter and operator instructions.
- Create: `docs/demo/storyboard.html` — keyboard-controlled, full-screen live backdrop runner.
- Create: `docs/demo/assets/manifest.json` — ordered scene contract, timing, status, asset path, and alt text.
- Create: `docs/demo/assets/backgrounds/opening.png` — text-free fragmented-learning illustration.
- Create: `docs/demo/assets/backgrounds/closing.png` — text-free confident-student bookend illustration.
- Create: `docs/demo/assets/scenes/01-problem.svg` through `07-result.svg` — final reviewable backdrops.

---

### Task 1: Reconcile PR #4 with the accepted P0 and lock the 60-second narration

**Files:**
- Modify: `docs/demo/demo-script.md`

**Interfaces:**
- Consumes: accepted P0 boundaries in `docs/spec/hybrid-okf-tutor-hackathon-spec.md`.
- Produces: six timed narration blocks covering seven visual scenes; exact spoken copy below.

- [ ] **Step 1: Add a scope legend immediately below the current format block**

Use these exact definitions:

```markdown
### Legenda zakresu

- **P0 / rdzeń demo:** rozumienie intencji pytania, dopytanie przy niejednoznaczności, pobranie kontrolowanej wiedzy z OKF, deterministyczne złożenie odpowiedzi oraz wykrycie sygnału frustracji w tekście ucznia.
- **ROADMAP / KONCEPCJA:** diagnoza, mapa luk, samodzielny wybór obszaru, sygnały behawioralne takie jak zmiana karty oraz automatyczna zmiana trudności.
- Mockupy oznaczone `ROADMAP / KONCEPCJA` pokazują kierunek produktu, a nie funkcje dostępne w bieżącym P0.
```

- [ ] **Step 2: Replace the presenter copy with the exact six-block narration**

```markdown
| Czas | Sceny | Mówi prezenter na żywo |
| --- | --- | --- |
| 0:00–0:08 | 01 | „Podręcznik, YouTube, korepetycje, czat AI. Pomocy jest dużo, ale jest rozproszona i nie zna tego ucznia.” |
| 0:08–0:22 | 02–03 | „Docelowo krótka diagnoza pokaże mapę luk, a uczeń wybierze obszar pracy.” |
| 0:22–0:36 | 04 | „Dziś pokazujemy działający rdzeń: model rozumie pytanie ucznia, a wiedza pochodzi z kontrolowanego OKF, nie z pamięci modelu.” |
| 0:36–0:44 | 05 | „Gdy pytanie jest niejasne, tutor dopytuje zamiast zgadywać.” |
| 0:44–0:53 | 06 | „Rozpoznaje też frustrację w słowach ucznia. Wykrywanie uciekającej uwagi i automatyczna zmiana trudności to następny etap.” |
| 0:53–1:00 | 07 | „Efekt? Nie gotowiec od AI, lecz droga do zrozumienia z kontrolowaną wiedzą.” |
```

- [ ] **Step 3: Remove or rewrite unsupported present-tense claims**

Replace all current claims equivalent to `żadne inne narzędzie`, `dokładnie wskazuje`, `natychmiast podnosi poziom`, `zauważa wzrok` and `każdy krok ugruntowany w zweryfikowanej wiedzy`. Keep diagnosis, gap map, tab drift, and adaptive difficulty only as visibly labeled roadmap concepts. Replace `zweryfikowana wiedza` with `kontrolowana wiedza z widocznym statusem weryfikacji`.

- [ ] **Step 4: Remove the final contradiction about a generated narrator**

The English section must end with:

```markdown
Prompty wizualne są wspólne dla obu wersji językowych. Zmienia się wyłącznie tekst prezentera mówiony na żywo oraz kontrolowane napisy interfejsu; nie generujemy audio ani lektora.
```

- [ ] **Step 5: Verify narration length and forbidden claims**

Run:

```bash
rg -n "ROADMAP / KONCEPCJA|P0 / rdzeń demo|nie generujemy audio ani lektora" docs/demo/demo-script.md
rg -n "żadne inne narzędzie|natychmiast podnosi|zauważa wzrok|wygenerowan.*lektor|zweryfikowana wiedza" docs/demo/demo-script.md
```

Expected: the first command finds all three scope/audio statements; the second command returns no matches.

- [ ] **Step 6: Commit the scope-safe script**

```bash
git add docs/demo/demo-script.md
git commit -m "docs: align live demo script with p0 scope"
```

### Task 2: Define the seven-scene asset contract

**Files:**
- Create: `docs/demo/assets/manifest.json`
- Create: `docs/demo/README.md`

**Interfaces:**
- Produces: ordered `scenes[]` records consumed by `docs/demo/storyboard.html`.
- Produces: `Scene = { id: string; startSeconds: number; durationSeconds: number; scope: "p0" | "roadmap" | "context"; asset: string; alt: string }`.

- [ ] **Step 1: Create the manifest with exact timing and scope**

```json
{
  "version": 1,
  "canvas": { "width": 1920, "height": 1080, "aspectRatio": "16:9" },
  "scenes": [
    { "id": "01-problem", "startSeconds": 0, "durationSeconds": 8, "scope": "context", "asset": "scenes/01-problem.svg", "alt": "Rozproszone źródła nauki: podręcznik, film, korepetycje i czat AI." },
    { "id": "02-diagnosis", "startSeconds": 8, "durationSeconds": 9, "scope": "roadmap", "asset": "scenes/02-diagnosis.svg", "alt": "Koncepcyjny quiz diagnostyczny z postępem trzy z ośmiu." },
    { "id": "03-gap-map", "startSeconds": 17, "durationSeconds": 5, "scope": "roadmap", "asset": "scenes/03-gap-map.svg", "alt": "Koncepcyjna mapa luk z wybranym obszarem Ułamki." },
    { "id": "04-grounded-core", "startSeconds": 22, "durationSeconds": 14, "scope": "p0", "asset": "scenes/04-grounded-core.svg", "alt": "Pytanie ucznia przechodzi przez rozpoznanie intencji do kontrolowanej wiedzy OKF." },
    { "id": "05-clarification", "startSeconds": 36, "durationSeconds": 8, "scope": "p0", "asset": "scenes/05-clarification.svg", "alt": "Tutor dopytuje, jakiej figury dotyczy pytanie o obwód." },
    { "id": "06-signals", "startSeconds": 44, "durationSeconds": 9, "scope": "p0", "asset": "scenes/06-signals.svg", "alt": "Frustracja wykryta w tekście jest funkcją P0, a sygnał zmiany karty jest oznaczony jako roadmapa." },
    { "id": "07-result", "startSeconds": 53, "durationSeconds": 7, "scope": "context", "asset": "scenes/07-result.svg", "alt": "Uczeń kończy sesję ze zrozumieniem, a wiedza pozostaje pod kontrolą OKF." }
  ]
}
```

- [ ] **Step 2: Add operator instructions**

Document these exact controls in `docs/demo/README.md`:

```markdown
- Open `storyboard.html` in Chrome and enter full-screen mode.
- `Space` starts or pauses the 60-second sequence.
- `ArrowRight` and `ArrowLeft` move one scene without changing the script.
- `R` resets to scene 01 and time 0:00.
- No network, microphone, camera, account, API key, or audio output is required.
- The operator rehearses one manual keyboard fallback before the live pitch.
```

- [ ] **Step 3: Validate the manifest**

Run:

```bash
jq -e '.version == 1 and (.scenes | length == 7) and ([.scenes[].durationSeconds] | add == 60) and ([.scenes[].startSeconds] == [0,8,17,22,36,44,53])' docs/demo/assets/manifest.json
```

Expected: `true` and exit code 0.

- [ ] **Step 4: Commit the asset contract**

```bash
git add docs/demo/README.md docs/demo/assets/manifest.json
git commit -m "docs: define live demo storyboard contract"
```

### Task 3: Establish the visual system and text-free bookend illustrations

**Files:**
- Create: `docs/demo/assets/backgrounds/opening.png`
- Create: `docs/demo/assets/backgrounds/closing.png`
- Create: `docs/demo/assets/scenes/01-problem.svg`
- Create: `docs/demo/assets/scenes/07-result.svg`

**Interfaces:**
- Consumes: palette and canvas constraints from this plan.
- Produces: two fictional, stylistically matched illustrations embedded by scenes 01 and 07.

- [ ] **Step 1: Generate the opening background with the imagegen skill**

Use this exact prompt, with no request for rendered text:

```text
Editorial flat illustration, 16:9 landscape, fictional Polish middle-school student seen from behind at a study desk, four visually distinct but text-free learning sources arranged around the desk: open mathematics textbook with abstract fraction shapes, paused tutorial window represented only by a play icon, generic tutoring receipt without letters or numbers, generic AI chat window made of blank rounded bubbles. Slightly cluttered composition, warm desk-lamp lighting, navy shadows, muted green and amber accents, mature educational tone, no logos, no readable text, no real person, no photorealism, generous safe margins for later vector labels.
```

Save the result as `docs/demo/assets/backgrounds/opening.png` at 1920×1080 or larger in 16:9.

- [ ] **Step 2: Generate the closing background by editing the opening image**

Use `opening.png` as the image reference and this exact edit prompt:

```text
Keep the same fictional student, illustration style, camera angle, desk, navy shadows, muted green and amber palette. Transform the scene into a calm conclusion: tidy desk, laptop being gently closed, confident relaxed posture, warm natural daylight instead of the desk-lamp mood. Remove the scattered resource windows. Leave clear space on the left for a vector closing statement. No readable text, no logos, no photorealism.
```

Save the result as `docs/demo/assets/backgrounds/closing.png`.

- [ ] **Step 3: Compose scene 01 as SVG**

Embed `../backgrounds/opening.png`, add four vector labels `Podręcznik`, `YouTube`, `Korepetycje`, `Czat AI`, and add the headline `Dużo pomocy. Brak jednego obrazu ucznia.` Use no product capability badge on this context scene.

- [ ] **Step 4: Compose scene 07 as SVG**

Embed `../backgrounds/closing.png`, add the closing copy `Nie gotowiec od AI.` and `Droga do zrozumienia z kontrolowaną wiedzą.`, followed by the small architecture line `LLM rozumie pytanie → OKF dostarcza wiedzę`.

- [ ] **Step 5: Verify both backgrounds and scene canvases**

Run:

```bash
file docs/demo/assets/backgrounds/opening.png docs/demo/assets/backgrounds/closing.png
ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 docs/demo/assets/backgrounds/opening.png
ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 docs/demo/assets/backgrounds/closing.png
rg -n 'viewBox="0 0 1920 1080"' docs/demo/assets/scenes/01-problem.svg docs/demo/assets/scenes/07-result.svg
```

Expected: both files are PNG images, both report a 16:9 dimension of at least 1920×1080, and both SVG files contain the exact viewBox.

- [ ] **Step 6: Commit the visual bookends**

```bash
git add docs/demo/assets/backgrounds docs/demo/assets/scenes/01-problem.svg docs/demo/assets/scenes/07-result.svg
git commit -m "docs: add live demo visual bookends"
```

### Task 4: Build the roadmap diagnosis scenes as deterministic SVG

**Files:**
- Create: `docs/demo/assets/scenes/02-diagnosis.svg`
- Create: `docs/demo/assets/scenes/03-gap-map.svg`

**Interfaces:**
- Produces: roadmap-only diagnosis mockups with no claim that they run in P0.

- [ ] **Step 1: Build scene 02**

Create a light UI mockup with the permanent upper-right ribbon `ROADMAP / KONCEPCJA`, title `Krótka diagnoza`, progress `3 / 8`, a fraction comparison question `Który ułamek jest większy?`, and four answer cards. Do not show an answer as correct; the scene represents an in-progress conceptual diagnostic.

- [ ] **Step 2: Build scene 03**

Reuse the exact scene-02 shell, keep the ribbon `ROADMAP / KONCEPCJA`, title the view `Mapa luk`, and show five topic cards: `Ułamki` amber, `Procenty` green, `Równania` amber, `Geometria` green, `Potęgi` green. Add a cursor/tap ring over `Ułamki` and the caption `Uczeń wybiera obszar pracy`.

- [ ] **Step 3: Verify scope labels and exact Polish copy**

Run:

```bash
rg -n "ROADMAP / KONCEPCJA" docs/demo/assets/scenes/02-diagnosis.svg docs/demo/assets/scenes/03-gap-map.svg
rg -n "Krótka diagnoza|3 / 8|Który ułamek jest większy|Mapa luk|Ułamki|Uczeń wybiera obszar pracy" docs/demo/assets/scenes/02-diagnosis.svg docs/demo/assets/scenes/03-gap-map.svg
```

Expected: both scenes contain the roadmap ribbon; every listed string is present.

- [ ] **Step 4: Commit the roadmap scenes**

```bash
git add docs/demo/assets/scenes/02-diagnosis.svg docs/demo/assets/scenes/03-gap-map.svg
git commit -m "docs: add clearly labeled diagnosis concept scenes"
```

### Task 5: Build the implemented-core and signal scenes as deterministic SVG

**Files:**
- Create: `docs/demo/assets/scenes/04-grounded-core.svg`
- Create: `docs/demo/assets/scenes/05-clarification.svg`
- Create: `docs/demo/assets/scenes/06-signals.svg`

**Interfaces:**
- Produces: P0 scenes grounded in the current spec, plus one visibly separated roadmap half in scene 06.

- [ ] **Step 1: Build scene 04 around the architecture boundary**

Use three connected columns:

```text
Uczeń: „ej a jak się liczy pole trapezu?”
LLM: rozumie intencję → trapez / wzór na pole
OKF: dostarcza kontrolowaną wiedzę → atom: formula
```

Add the exact footer badge `OKF • DEV / WIEDZA NIEZWERYFIKOWANA`. Do not write `zweryfikowana wiedza` anywhere in the scene.

- [ ] **Step 2: Build scene 05 around deterministic clarification**

Show two chat bubbles:

```text
Uczeń: „Jaki jest wzór na obwód?”
Tutor: „Obwód jakiej figury masz na myśli?”
```

Add the quiet caption `Dopytuje zamiast zgadywać` and a `P0 / RDZEŃ DEMO` badge.

- [ ] **Step 3: Build scene 06 with a hard scope divider**

The left 60% is P0 and shows:

```text
Uczeń: „to bez sensu, mam dość”
Sygnał w tekście: frustracja
Tutor: „Zróbmy jeden mniejszy krok.”
```

Label the left side `P0 / RDZEŃ DEMO`. The right 40% shows only a generic browser-tab switch icon and difficulty arrow under the permanent ribbon `ROADMAP / KONCEPCJA`; label it `Sygnały behawioralne i adaptacja trudności`. Show no face, eye, camera, microphone, biometric outline, or surveillance icon.

- [ ] **Step 4: Verify claims and privacy boundaries**

Run:

```bash
rg -n "OKF • DEV / WIEDZA NIEZWERYFIKOWANA|Dopytuje zamiast zgadywać|P0 / RDZEŃ DEMO|ROADMAP / KONCEPCJA" docs/demo/assets/scenes/04-grounded-core.svg docs/demo/assets/scenes/05-clarification.svg docs/demo/assets/scenes/06-signals.svg
rg -n -i "camera|kamera|gaze|wzrok|microphone|mikrofon|biometric|biometr|zweryfikowana wiedza" docs/demo/assets/scenes/04-grounded-core.svg docs/demo/assets/scenes/05-clarification.svg docs/demo/assets/scenes/06-signals.svg
```

Expected: the first command finds every required scope/status label; the second command returns no matches.

- [ ] **Step 5: Commit the P0 scenes**

```bash
git add docs/demo/assets/scenes/04-grounded-core.svg docs/demo/assets/scenes/05-clarification.svg docs/demo/assets/scenes/06-signals.svg
git commit -m "docs: add scope-safe p0 demo scenes"
```

### Task 6: Add the live runner, perform visual QA, and rehearse the pitch

**Files:**
- Create: `docs/demo/storyboard.html`
- Modify: `docs/demo/README.md`
- Modify: `docs/demo/demo-script.md`

**Interfaces:**
- Consumes: `docs/demo/assets/manifest.json` and the seven SVG paths.
- Produces: an offline full-screen runner with deterministic timing and manual fallback.

- [ ] **Step 1: Implement the offline runner**

`storyboard.html` must fetch no remote resources. Embed the seven manifest records directly in a JavaScript constant matching `manifest.json`, render one `<img>` at a time, preload all seven assets, advance by `durationSeconds`, pause/resume on `Space`, navigate on arrow keys, reset on `R`, and show a small operator-only timer that disappears in browser full-screen mode.

- [ ] **Step 2: Add an automated consistency assertion inside the runner**

Before enabling Start, assert:

```js
const totalDuration = scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);
if (scenes.length !== 7 || totalDuration !== 60) {
  throw new Error("Storyboard contract must contain 7 scenes totaling 60 seconds");
}
```

- [ ] **Step 3: Gate the `działający rdzeń` narration against the deployed P0**

On the exact deployment and commit used for the presentation, manually verify all three flows:

```text
„ej a jak się liczy pole trapezu?” → controlled OKF answer with a visible source/status
„Jaki jest wzór na obwód?” → clarification asking which figure, without guessing
„to bez sensu, mam dość” → supportive response based on the text signal, without a medical claim
```

If any flow fails, replace the 0:22–0:36 line with this exact fallback and record the missing flow in `docs/demo/README.md`:

```text
„Rdzeń, który budujemy, ma rozumieć pytanie ucznia, a wiedzę pobierać z kontrolowanego OKF, nie z pamięci modelu.”
```

- [ ] **Step 4: Open and inspect every scene in Chrome at 1920×1080**

Verify at 100% zoom that no label clips, no line overlaps, the smallest copy remains legible from presentation distance, all roadmap/P0 ribbons are visible, and the opening/closing illustrations use the same fictional student and style. Use Chrome full-screen once to confirm the operator timer disappears.

- [ ] **Step 5: Run three timed rehearsals**

Record the three durations in `docs/demo/README.md` under `## Rehearsal log`. Acceptance range is 55–60 seconds for every run; no run may exceed 60 seconds. If a run is too long, shorten spoken copy rather than accelerating delivery or cutting the visible scope labels.

- [ ] **Step 6: Run the final repository checks**

```bash
jq -e '.version == 1 and (.scenes | length == 7) and ([.scenes[].durationSeconds] | add == 60)' docs/demo/assets/manifest.json
rg -L 'viewBox="0 0 1920 1080"' docs/demo/assets/scenes/*.svg
rg -n -i "audio|lektor|voice-over|tts|ROADMAP / KONCEPCJA|P0 / RDZEŃ DEMO|DEV / WIEDZA NIEZWERYFIKOWANA" docs/demo
git diff --check
```

Expected: manifest check exits 0; `rg -L` prints nothing; audio references only say they are forbidden; required scope/status labels are present; `git diff --check` prints nothing.

- [ ] **Step 7: Commit the ready-to-present package**

```bash
git add docs/demo
git commit -m "docs: add rehearsable 60-second live demo package"
```

## Final Acceptance Gate

- [ ] PR #4 no longer presents Phase 2 or roadmap concepts as implemented P0 behavior.
- [ ] The Polish narration completes naturally in 55–60 seconds in three consecutive rehearsals.
- [ ] All seven scenes render offline at 16:9 and follow one visual system.
- [ ] Every Polish UI label is authored as vector text and has been visually proofread.
- [ ] There is no generated audio, voice-over, TTS, camera/gaze claim, real student data, or secret.
- [ ] Draft/pending OKF knowledge is visibly labeled `DEV / WIEDZA NIEZWERYFIKOWANA`.
- [ ] The exact deployed P0 passed the three-flow gate, or the narration uses the documented `rdzeń, który budujemy` fallback.
- [ ] The operator has tested automatic timing and manual arrow-key fallback.
