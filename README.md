# 🌙 Tracker

A personal finance tracking web app. It records income, expenses, and recurring subscriptions, calculates your balance, and shows how much you'll have left (or be short) at the end of the month.

It was born from a personal need: I wanted to keep track of my own money and, at the same time, practice full stack development with a real database.

<img width="1919" height="940" alt="Tracker home screen" src="https://github.com/user-attachments/assets/ea20ce1e-70e5-4d4c-9c30-637d1fccda4a" />

## Features

- Income and expense entries with description and category
- Balance, total income, total expenses, and projected balance
- Doughnut chart (income vs. expenses) that updates with every entry
- User-created categories
- Recurring subscriptions with a due day
- Pending charges generated automatically, with a Pay button that creates the transaction
- Forecast page with spending by category and a chart showing whether the monthly balance is positive or negative
- Data stored in a database, so nothing is lost when the page is closed

## Tech Stack

| Layer | Technologies |
|---|---|
| Front-end | HTML5, CSS3, JavaScript, Chart.js |
| Back-end | Python, FastAPI, SQLAlchemy, APScheduler |
| Database | SQLite |

## Getting Started

Prerequisites: Python 3.10+ and the VS Code Live Server extension.

```bash
git clone https://github.com/lucasz-gabriel/Tracker
cd Tracker/backend

python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

pip install -r requirements.txt
uvicorn main:app --reload
```

With the API running (`http://127.0.0.1:8000`), open `frontend/index.html` with Live Server.
The automatic API documentation is available at `http://127.0.0.1:8000/docs`.

The `tracker.db` file is created automatically on the first run.

## Design Decisions

- **Amounts stored in cents (integers):** `R$ 19.90` is stored as `1990`. Floats accumulate rounding errors, which is a problem for money.
- **Balance calculated, not stored:** the database only stores transactions, and the balance is their sum. This keeps the raw data intact, and any chart can be derived from a query.
- **Subscriptions separate from transactions:** a subscription is the "template" (Netflix, day 12) and becomes a charge when the due day arrives.
- **Database kept out of Git:** `.gitignore` protects `tracker.db`, which contains personal data.

## Author

**Lucas Roque**, Software Engineering student at Fametro (Manaus, Brazil).
[LinkedIn](https://linkedin.com/in/lucas-gabriel-8791b53aa) · [GitHub](https://github.com/lucasz-gabriel)
