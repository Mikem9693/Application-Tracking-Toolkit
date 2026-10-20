# Email Evidence Saver

Part of the [Application Tracking Toolkit](../README.md).

The tracker records what happens to each application. The email evidence saver keeps the proof. It is an optional, standalone Google Apps Script that automatically saves application acknowledgements and rejections from Gmail as dated PDFs in Google Drive, building a complete, chronological record of every application and its outcome.

I built it when I needed to produce that record and found that saving several hundred emails by hand was slow and easy to get wrong. Like the tracker, it takes a repetitive process and makes it run itself.

It is deliberately kept separate from the tracker. Combining them would mean anyone copying the tracker was asked to grant access to their Gmail, so the evidence saver is opt-in and lives in its own project.

## What it does

**Daily capture.** Two functions check Gmail each day for new acknowledgements and rejections and save each one as a PDF, showing the sender, recipient, date and subject.

**Separate folders.** Acknowledgements and rejections are filed separately, and rejections are excluded from the acknowledgements folder so nothing is saved in both.

**Consistent naming.** Files are named by type, company and date, for example `Application Acknowledgement - Stripe - 13-01-26`, so they are easy to match against the tracker.

**No duplicates.** The script remembers every email it has saved by its Gmail ID, so overlapping runs and repeat runs never produce a second copy.

**Backfill.** A one-off function captures emails already in your inbox from a date you choose. It runs in the background and continues on its own until complete, so you can start it and walk away.

**Private by design.** The script runs entirely inside your own Google account. No data is sent anywhere else.

## Setup

1. Go to [script.google.com](https://script.google.com) and click **New project**.
2. Delete the placeholder code and paste in `email-evidence-saver.gs`.
3. Update the settings at the top of the script (see below).
4. Check **Project Settings**, then **Time zone**, is correct, as file dates follow it.
5. Click **Save**.
6. Select `acknowledgementRun` in the function drop-down and click **Run** to authorise it. Google will show an "unverified app" warning, as this is your own script; click **Advanced** and continue.
7. Open **Triggers** (the clock icon) and add two daily time-based triggers, one for `acknowledgementRun` and one for `rejectionRun`.

The first run records the set-up date. From then on, the daily triggers save any new emails that arrive.

## Settings

All settings are at the top of the script.

| Setting | What it controls | Default |
|---|---|---|
| `ROOT_PATH` | Folder path inside My Drive | `['Job Applications']` |
| `BACKFILL_FROM` | Date the backfill searches from | 1 January 2026 |
| `DATE_FORMAT` | Date format in file names | `dd-MM-yy` |
| `ACK_FOLDER` | Subfolder for acknowledgements | `Application Acknowledgements` |
| `ACK_PREFIX` | File name prefix for acknowledgements | `Application Acknowledgement` |
| `REJ_FOLDER` | Subfolder for rejections | `Application Rejections` |
| `REJ_PREFIX` | File name prefix for rejections | `Application Rejection` |

A few notes:

- **Folder paths** can be nested, for example `['Employment', 'Job Search']`. Folders are created automatically if they do not exist. Names must match existing folders exactly, including capitals, or a new folder will be created alongside.
- **Months in `BACKFILL_FROM` start at 0**, so `new Date(2026, 0, 1)` is 1 January and `new Date(2026, 5, 1)` is 1 June.
- **Avoid forward slashes in `DATE_FORMAT`**, as they are not allowed in file names on Windows. Hyphens or full stops work well.
- **Do not change the `memory` labels** (`ACK_` and `REJ_`) further down the script after the first run. They are how the script remembers what it has saved.

With the defaults, files are saved to:

    My Drive
    └── Job Applications
        ├── Application Acknowledgements
        └── Application Rejections

## Backfilling existing emails

To capture emails received before set-up:

1. Set `BACKFILL_FROM` to the date your applications began.
2. Select `backfillAll` and click **Run**.
3. Close the tab. The backfill continues automatically until complete.

It works through acknowledgements and then rejections, pausing before Google's six-minute limit and scheduling itself to carry on a minute later. When it has finished, it removes its own trigger. Do not add a trigger for `backfillAll` yourself.

**Checking progress.** Each run shows "Execution completed" under **Executions** whether it paused or finished, so open the run and check the log message itself: "Paused" means it is still working, "Backfill complete" means it is done. While it is working, a temporary `backfillAll` trigger appears under **Triggers**.

**Order.** Gmail returns the newest emails first, so the backfill works backwards in time and the oldest dates appear last.

**Stopping and resuming.** `stopBackfill` cancels it at any point, and running `backfillAll` again resumes from where it stopped. Avoid starting a second run while one is already scheduled.

**Daily limit.** Personal Google accounts allow around 90 minutes of trigger run time per day. A very large backlog may stop with a "too much computer time" error; if so, run `backfillAll` again the next day.

## What to expect

**More acknowledgements than applications.** Many applications produce two confirmations, one from the job board (for example LinkedIn's "your application was sent") and one from the employer's own recruitment system. As a guide, around 330 applications produced just over 500 acknowledgements in testing. Both are kept, as two independent confirmations of one application are stronger evidence than one.

If you would rather keep one per application, Google Drive indexes the text inside PDFs, so searching the folder for a sender such as `jobs-noreply@linkedin.com` will list the job board copies for moving elsewhere.

**A short review pass.** Once the backfill has finished:

- Rename any files saved as `Unknown Company`, using the sender or body of the email.
- Move anything out of scope into a separate subfolder rather than deleting it, so there is a record of what was reviewed and set aside.

Renaming, moving or deleting files is safe. The script remembers emails by their ID, not their file name, so nothing you change will be saved again.

## Getting the PDFs onto your computer

Install **Google Drive for desktop** and choose **Mirror files** in its settings. The folders then sync to your computer automatically, ready to print, bundle or share.

## How it identifies emails

**Acknowledgements:** the subject line contains "application", "applying", "applied", "candidacy" or "interest", excluding job alerts, promotions, social emails and anything that reads as a rejection.

**Rejections:** the email contains common rejection phrasing, such as "not been successful", "other candidates" or "regret to inform", alongside words such as "application", "role" or "position".

Both rules can be adjusted in the **Matching rules** section of the script. A phrase added to `REJECTION` applies to both functions automatically, keeping the two folders in step.

## How company names are worked out

Emails do not contain a company field, so the script works it out in this order:

1. The sender's display name, for example "Stripe Recruiting" becomes "Stripe".
2. The subject line, for example "Thank you for applying to Meta".
3. The sender's email domain, for example `careers@mojo.com` becomes "Mojo".

Recruitment systems and job boards (Workday, Greenhouse, LinkedIn and similar) are skipped at each step, as they are not the employer. If nothing reliable is found, the file is named `Unknown Company` for manual renaming.

## Limitations

- The matching is rule-based, so the occasional email will be missed or misfiled.
- Externally hosted images, such as company logos, may not appear in the PDFs.
- Files sort by company rather than date, as the date sits at the end of the name.
- Two emails from the same company on the same day share a file name. Drive keeps both, and Drive for desktop adds "(1)" to the second when syncing.
- Interview invitations and offers are not yet separated and may be saved as acknowledgements.
- Gmail only. Outlook and other providers are not yet supported.

## What is in this folder

- **README.md**: this file.
- **email-evidence-saver.gs**: the script.
