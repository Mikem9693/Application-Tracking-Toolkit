# Job Search Tracker

Part of the [Application Tracking Toolkit](../README.md).

A Google Sheets tracker for running a job search from one single source of truth, rather than a scattered list of applications. It tracks every application through defined stages, updates their status automatically, retires the ones that have gone quiet, and rolls everything up into a metrics layer so you can see how your search is actually performing.

## Get your own copy

**[Make a copy of the tracker](https://docs.google.com/spreadsheets/d/1PAmotTzKD38yNN8pmGU1_ZzWf-HAqePQC4e97QgBAq0/copy)**

Clicking the link above creates your own private copy in your own Google Drive. It is entirely yours from that point: your data never touches the original, and nobody else can see it. You will need to be signed into a Google account for the copy to save.

The copy opens with sample data already in it so you can see how everything works. Delete the example rows (rows 2 to 7) when you are ready to start logging your own applications.

## What it does

The tracker is built around a simple pipeline. You log an application with a few basic facts, and the toolkit keeps its status current and reports on the whole picture for you.

- **Structured tracking.** Every application is logged with its date, company, role, source, salary range, and a row of stage columns (cover letter, sift, interviews, offer) so you always know exactly where each one stands.
- **An optional match score.** The tracker includes a "Claude Match" column for an AI-generated score reflecting how well a role fits your CV. It is entirely optional: leave it blank, fill it in yourself as a manual fit rating, or generate it automatically with the [companion automation project](https://github.com/Mikem9693/job-search-automation), which scores each role against your CV before you apply.
- **Automatic status updates.** A script keeps each application's status accurate: applications that pass the sift move to Ongoing, those that fail move to Closed, and new ones default to Waiting. Anything you have manually marked Closed is left untouched, so your own decisions are never overwritten.
- **Automatic clearing of stale applications.** Applications older than two weeks with no interview and no sift result are automatically marked as not having passed, so your active pipeline reflects reality rather than filling up with roles that have gone silent.
- **A metrics layer.** A totals tab rolls up your whole search: applications sent, cover letters written, sift pass rate, interviews reached, offers, hit rate, rejection rate, applications per day, and a breakdown by application source. A separate analysis tab breaks down interview conversion by CV version, so you can see which version of your CV is actually landing and tailor from there.
- **Ready for a dashboard.** The metrics and analysis tabs are structured to feed a visual dashboard. You can connect the sheet to Looker Studio or the reporting tool of your choice to see your funnel, trends and CV performance at a glance.

## Setup

1. **Make your copy** using the link above.
2. **Explore the sample data.** The tracker comes populated so you can see the pipeline, the totals and the analysis working together.
3. **Run the automation once to authorise it.** Open the **Extensions** menu, then **Apps Script**, and run either function. The first time, Google will ask you to authorise the script. This is standard for any Apps Script and it only ever runs inside your own copy of the sheet. You can review the script before running it using the "View Apps Script file" button on the copy screen.
4. **Clear the sample rows** (rows 2 to 7) and start logging your own applications.

## Running the automation

The tracker includes two functions, found under **Extensions**, then **Apps Script**:

- `updateStatus` sets each application's status based on whether it passed the sift.
- `updatePassSift` marks applications as not passed once they have been silent for two weeks.

Run them whenever you want to refresh your pipeline. If you would prefer them to run on their own, add a time-based trigger in the Apps Script editor (**Triggers**, then add a trigger on a daily timer).

## A note on the columns

The totals tab references the tracker columns by their position, not by their name. This keeps the formulas simple and readable. The practical effect is that you can rename columns freely and add new columns at the far right without breaking anything, but if you insert or reorder columns you will need to update the totals formulas to match. The safest habit is to add any new columns on the right-hand end.

The automation looks up a handful of columns by name (`Application Date`, `Job Title`, `Status`, `Pass Sift` and `First Interview`), so if you rename any of those, update the matching name in the script.

The script also expects the tracker tab to be named `Application Tracker 2026`. If you rename the tab, for example for a new year, update the name in the script to match.

## Keeping the evidence

The tracker records what happens to each application, but not the emails behind it. If you need a record of acknowledgements and rejections, for example to evidence your search, the [Email Evidence Saver](../Email-Saver/) saves them automatically from Gmail as dated PDFs, named so they are easy to match against the tracker.

## What is in this folder

- **README.md**: this file.
- **apps-script.gs**: the automation script, provided so you can read it before copying the sheet, or paste it in manually if you ever need to. It copies across with the sheet automatically, so you usually will not need this.
- **Application Tracker Template Published.xlsx**: a downloadable snapshot of the template, as a fallback for anyone who would rather work in Excel or keep an offline copy.
