# Français Susu: how to use it

## What is in the folder

| File | What it is |
|---|---|
| `lessons.json` | **The words.** One field per language: `susu`, `maninka`, `pular`, `french`, `english`. |
| `ui-text.json` | **The app's own text** (buttons, titles, messages). One block per language. |
| `edit.html` | The word table page. Native speakers fix words and app text here. |
| `index.html`, `style.css`, `js/` | The app itself. No need to touch. |
| `fonts/` | The Noto Sans font, saved inside the app so ɛ ɔ ɲ ɗ ɓ ñ show on every phone, even offline. Free to share (licence in `fonts/OFL.txt`). |
| `sw.js`, `manifest.webmanifest`, `icons/` | Make the app installable and work offline. |
| `pictures/`, `audio/` | Create these folders later for pictures and voice recordings. |
| `CHANGELOG.md` | **What changed and when.** Newest change at the top. Add one line each time you change the app or the lessons. |

## Open it on a phone

The app must be on a web address (https). It does not work by opening the file directly.

1. Make a free account on **Netlify** (netlify.com).
2. Go to **app.netlify.com/drop** on a computer.
3. Drag the whole app folder onto the page.
4. Netlify gives you an address like `https://something.netlify.app`. Send it to the phones (WhatsApp, SMS).
5. On the phone, open the address in **Chrome**.
6. Tap **Installer l'appli** (or Chrome menu ⋮ → **Add to Home screen**). The app now has its own icon.
7. After the first opening, it works **with no internet**. Points and streak are saved on the phone.

## Choose the languages

The app has 5 languages: **Susu, Maninka, Pular, Français, English**, and 7 lessons:
1 Salutations, 2 Nombres 1 à 10, 3 La famille, 4 Phrases utiles, 5 Nourriture et boisson, 6 Marché et argent, 7 Le corps.

The first time the app opens, it asks two questions:

1. **I speak** (Je parle): tap your language. The question is written in every language side by side, each with its own round badge.
2. **I want to learn** (Je veux apprendre): tap the language to learn. Your own language is not offered.

- All screens are then shown in the "I speak" language.
- The app text for Susu, Maninka and Pular is not translated yet, so those screens show French with a purple dashed **TO BE TRANSLATED** tag.
- To change later: on Home, tap the button with the two badges (**SU → FR**, **Changer**).
- Each pair is its own course. Susu → French and French → Susu have **separate points and streaks**.

In a lesson:
- **Word card**: the word in your language, then the word to learn. A short explanation in brackets is shown under some words, like *(respectful)* or *(also means child)*.
- **Pick the right word**: see your language, choose from 3 in the language you learn.
- **What does it mean?** (reverse): see the language you learn, choose the meaning in your language.
- **Match the pairs**: your language on the left, the language you learn on the right.

While a word is missing in a language, the card shows a stand-in word in *italics* (English or French) with the purple tag, so you can still test the lesson.

Some draft words are written the same for different meanings (Susu **I nu wali** = Salut, Comment ça va and Merci; Pular **A jaraama** = Bonjour and Merci; Pular **biɗɗo** = fils and fille). The app never puts two of these in the same question, so there is always one right answer. Because of this, Greetings in Susu has only one "match the pairs" round instead of two.

## Draft words: "À vérifier / To check"

All the Susu, Maninka and Pular words come from Peace Corps books. They are **drafts** until a native speaker checks them.

- Next to each draft word, the app and the word table show a small blue tag: **À vérifier / To check**.
- In the word table, under each draft there is a **✓ Confirmé / Confirmed** button. Tap it when the word is right.
- If the word is wrong, just type the right word. That also removes the tag.
- At the top of the word table you see, for each language, how many words are still **to translate** and how many are still **to check**.

## The colours

The app uses the three colours of Guinea's flag. Each colour always means the same thing:

| Colour | Means | Where you see it |
|---|---|---|
| **Green** | Go / correct | Main buttons (Continuer), lesson numbers, the right answer, "Bravo" |
| **Yellow** | Your score | Points ★ and days in a row 🔥, the tile you picked in "match the pairs", finished lessons ✓ |
| **Red** | Title / wrong | The title band at the top, the wrong answer |
| **Purple, dashed** | Still to translate | The **TO BE TRANSLATED** tag and the boxes to fill in the word table |
| **Blue outline** | Draft, to check | The **À vérifier / To check** tag |

- A thin red, yellow and green stripe sits at the top of Home, like the flag.
- Text on green and red is white. Text on yellow is dark.
- The background stays white (or dark grey when the phone is in dark mode), so text is easy to read.
- On Progress, ★ = best score for a lesson and ⟳ = how many times it was played.

## Edit words and app text: easy way (word table)

1. In the app, tap **Table des mots** at the bottom of the home screen (or open `.../edit.html`).
2. At the top, tap a language to **show or hide** its column (crossed out = hidden). **Fichiers** shows or hides the picture and audio columns. Tip: a Pular speaker can hide Susu and Maninka to see only Pular, French and English.
3. Purple dashed boxes = not translated yet. Type in the box.
4. Draft words have the **To check** tag and a **Confirmé** button (see above).
5. Some words have small extra boxes under them:
   - **ALT** = another way to say it, like "I fɛɲɛn = afternoon".
   - **NOTE** = a short explanation, like "respectful".
   Speakers can correct these too. Empty a box to remove it.
6. Part **Mots / Words** = the lessons. Part **Textes de l'appli / App text** = buttons and messages.
7. Changes are saved on that phone, and the app uses them right away, so the speaker can test them.
8. When done, tap **Télécharger lessons.json** and **Télécharger ui-text.json**. Send both files back to you.
9. If download does not work, tap **Copier / Copy** and paste the text into a message.
10. On a computer, **Imprimer** prints the tables with an empty **Correction** column for writing by hand.

**Effacer mes changements** throws away the changes on that phone and goes back to the official files.

If you put a newer `lessons.json` online (with a higher `"version"` number), phones use the new file, even if someone typed changes there before. Their old changes are kept aside on the phone, not lost; the word table says "Older changes set aside".

## Edit by hand

Open the file with any text editor (Notepad on Windows, or a free app like "QuickEdit" on Android). Save it as **UTF-8** so the special letters ɛ ɔ ɲ ɗ ɓ ñ stay correct.

A word in `lessons.json`:

```
{
  "french": "Bonjour", "english": "Hello / Good morning",
  "susu": "I kɛna", "maninka": "I ni tilin", "pular": "A jaraama",
  "status": { "susu": "draft", "maninka": "draft", "pular": "draft" },
  "alt": { "susu": "I fɛɲɛn = afternoon", "maninka": "I ni saxuma = morning", "pular": "On jaraama = respectful" },
  "picture": "", "audio": ""
},
```

- `status`: `"draft"` = from a book, not checked. Change to `"confirmed"` when a speaker has checked it.
- `alt`: other ways to say it. `note`: a short explanation (for example `"note": { "pular": "respectful" }`). Both are optional.

A text in `ui-text.json` (inside the `"susu"` block):

```
"continue": "TO BE TRANSLATED",
```

Rules:
- Only change the text **between the quotes**.
- Do not remove commas `,` quotes `"` or brackets `{ } [ ]`.
- The last item in a list has **no comma** after it.
- `picture`: a file name in the `pictures` folder, like `"bonjour.jpg"`.
- `audio`: a file name, like `"bonjour.mp3"`. Put each language's recording in its own folder: `audio/french/bonjour.mp3`, `audio/pular/bonjour.mp3`. A play button appears only when the file exists.
- The sponsor message is `"sponsorMessage"` in each block of `ui-text.json`. A web link can go in `"sponsorLink"` at the top.
- When you send out a new `lessons.json`, add 1 to its `"version"` number (4 → 5).
- To add a lesson, copy a whole lesson block (from `{ "id":` to its closing `}`), paste it after a comma, and give it a new `id` (small letters, no spaces, like `"colors"`).

If a file has a mistake, the app shows the **file name and line number**. Go to that line and look for a missing comma or quote.

After editing, upload the folder again. Phones get the new text the next time they open the app with internet.

## Add another language (for example Kissi)

Two steps:

1. **ui-text.json**: copy the whole `"pular": { ... }` block, paste it after a comma, and change:
   - `"pular"` → `"kissi"` (the code, small letters, no spaces)
   - `"name"` → `"Kissi"` (written the way its speakers write it)
   - `"symbol"` → 2 letters for the badge, like `"KI"`
   - `"color"` → a dark colour for the badge, like `"#4A3B6B"`. Not red, yellow, green or purple, and not too close to the other badges (Susu brown, Maninka dark blue-green, Pular burnt orange, Français blue, English blue-grey).
   - The texts stay `"TO BE TRANSLATED"` until someone translates them.
2. **lessons.json**: add `"kissi": "..."` to each word. Easier: open the word table. A **Kissi** column appears by itself. Type the words there and download the file.

The new language now appears on the first screen, in both "I speak" and "I want to learn".

If the new language uses letters that are not in the font (not ɛ ɔ ɲ ɗ ɓ ñ ŋ ƴ), ask the programmer to add them to `fonts/`.

## Keep track of changes (CHANGELOG.md)

`CHANGELOG.md` lists every change with its date, newest at the top. Each time you change the app or the lessons, add one short line at the top, for example:

```
- 2026-11-20: Susu words for Greetings checked by Mariama.
```

## For the programmer later

- `js/content.js` is the only place that loads lessons and app text. Change `getFile()` to download from a server.
- `js/storage.js` keeps one course per language pair (`susu-french`, `pular-french`...) and a list of events (language chosen, lesson started, lesson finished) with a random phone ID. Send `Store.readEvents()` to a server to count users for sponsors, then call `Store.clearEvents()`.
- When you change app files, change `VERSION` in `sw.js` (fs-v4, fs-v5...) so phones get the new version.
- Fonts: `fonts/noto-sans-latin.woff2` (normal letters) and `fonts/noto-sans-special.woff2` (only ɛ ɔ ɲ ɗ ɓ ŋ ƴ and their capitals), both from Google Fonts, 43 KB in total. To add letters, download a new subset from fonts.googleapis.com with the `text=` option and add it to `fonts/fonts.css`.
