# Changelog: Français Susu

What changed, and when. The newest change is at the top.
Each time you change the app or the lessons, add one short line at the top with the date.

## 2026-11-10: 4 new lessons (4 to 7)

- New lessons: 4 Phrases utiles / Useful phrases, 5 Nourriture et boisson / Food and drink, 6 Marché et argent / Market and money, 7 Le corps / The body. The app now has 7 lessons and 57 words.
- All new words in Susu, Maninka and Pular are drafts from Peace Corps books, with the "À vérifier / To check" tag.
- Words marked "?" stay "TO BE TRANSLATED": Susu Oui, Non, la viande, le lait, le prix, le ventre; Maninka Oui, Non, J'ai faim, J'ai soif, l'oignon, manger; Pular la bouche.
- Lesson 1, Merci in Pular: the other ways to say it are now "Albarka, Alhamdullilahi" (was only "Alhamdullilahi").
- lessons.json is now version 4.

## 2026-11-10: Maninka and Pular, first words in 3 languages

- Two new languages: **Maninka** and **Pular**. They are in "I speak", "I want to learn" and the word table.
- All 28 words filled in for Susu, Maninka and Pular from Peace Corps books. Words marked "?" stay "TO BE TRANSLATED": Susu "la fille", Maninka "Salut" and 6 to 9, Pular "S'il vous plaît".
- Every book word is a **draft**: the app and the word table show "À vérifier / To check" next to it. In the word table, tap "Confirmé / Confirmed" or type a correction to remove it.
- Other ways to say a word (**alt**) and short explanations (**note**, like "respectful") are kept with each word. Notes show on word cards; alt and notes can be edited in the word table.
- App text (buttons, titles) for Maninka and Pular is "TO BE TRANSLATED", so those screens show French for now. Lesson titles too.
- The Noto Sans font is now saved inside the app (43 KB), so ɛ ɔ ɲ ɗ ɓ ñ show on every phone, even offline.
- Some draft words are written the same for different meanings (Susu "I nu wali", Pular "A jaraama", Pular "biɗɗo"). Questions never show two answers that look the same.
- Word table: for each language, it counts words to translate and words to check.
- lessons.json is now version 3. Changes typed on a phone before this update are kept aside, so the new words show.

## 2026-11-09: Guinea flag colours

- New look with the colours of Guinea's flag: green, yellow and red.
- Green = main buttons and the right answer. White text on green.
- Yellow = points, days in a row, finished lessons, and the tile you picked. Dark text on yellow.
- Red = the title band at the top and the wrong answer. White text on red.
- A thin red, yellow and green stripe at the top of Home and of the word table.
- The "TO BE TRANSLATED" tag is now purple with a dashed border, so it never looks like a yellow highlight. The boxes to fill in the word table are purple too.
- The Susu and English badges have new colours that don't look like flag colours (Susu brown, English blue-grey).
- On Progress, best score and times played are now shown with icons (★ and ⟳) instead of words.
- New app icon in flag colours.
- Added this file (CHANGELOG.md).

## 2026-11-09: Choose your languages

- First screen: "I speak" and "I want to learn". Susu, Français and English. The question is written in every language side by side.
- Lessons work both ways: Susu → French and French → Susu (and with English).
- New question type: see the word you are learning, pick its meaning in your language.
- Points and days in a row are kept separately for each language pair.
- All app text (buttons, titles, messages) moved to a new file, ui-text.json, with one block per language. French and English filled in; Susu left as "TO BE TRANSLATED".
- Word table: one column per language, with buttons to show or hide each column. New table for the app text.
- Voice recordings now go in one folder per language (audio/french/, audio/susu/).
- Points from the first version were kept.

## 2026-11-09: First version

- Text-only app to learn French for Susu speakers. Works on a phone, can be installed, works offline after the first visit.
- Screens: Home (lessons), Lesson, Result (points), Progress.
- 3 lessons: Greetings, Numbers 1–10, Family. French and English filled in; Susu left as "TO BE TRANSLATED".
- Lesson types: word card, pick the right answer (3 choices), match 4 pairs.
- Points and days in a row, saved on the phone.
- Sponsor message on Home and after each lesson.
- Word table page (edit.html) so native speakers can read and fix words, then download the new lessons.json.
- GUIDE.md: how to open the app on a phone and how to edit the lessons.
