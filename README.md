# Python Quiz

A static multiple-choice test for Python students, built with plain HTML, CSS and JavaScript (no backend).

- A student enters their name and answers 40 questions one at a time: easy questions first, then medium, then hard.
- Topics: Python basics, OOP, NumPy, Pandas, Matplotlib.
- At the end the student sees their score, a breakdown by level and by topic, and a review with the right answers.
- **Copy my result** copies a short summary the student can send to the teacher.

Results are not saved anywhere, because there is no backend.

## Files

| File           | What it is                                    |
|----------------|-----------------------------------------------|
| `index.html`   | The page                                      |
| `style.css`    | Styles (light and dark mode)                  |
| `script.js`    | Quiz logic                                    |
| `questions.js` | The 40 questions: edit this file to change them |

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
```

## Deploy on Vercel

1. Go to https://vercel.com and sign in with GitHub.
2. Click **Add New → Project** and import this repository.
3. Keep the defaults: Framework Preset **Other**, no build command, output directory = repository root.
4. Click **Deploy**. Every push to `main` redeploys automatically.

## Add or edit questions

Each entry in `questions.js` looks like this:

```js
{ category: "Python basics", level: "easy", question: "What does this print?",
  code: "print(2 ** 3)", options: ["6", "8", "9", "5"], answer: "8" },
```

`level` is `"easy"`, `"medium"` or `"hard"`. `code` is optional. `answer` must exactly match one of the `options`.
