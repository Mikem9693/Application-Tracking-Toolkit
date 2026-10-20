# Application Tracking Toolkit

A set of Google tools for running a job search as one single source of truth, rather than a scattered list of applications. Together they track every application through defined stages, keep its status current, report on how the search is performing, and keep the email evidence behind it.

I built this during my own job search. As a delivery professional, treating the search as a portfolio of initiatives with a proper pipeline and reporting felt natural, and it turned an anxious, ad-hoc process into something measurable and calm. This is a cleaned, shareable version of the tools I used, free for anyone to copy and adapt.

## What is in the toolkit

### [Job Search Tracker](Application-Tracker/)

A Google Sheets tracker that logs every application through defined stages, updates statuses automatically, retires applications that have gone quiet, and rolls everything up into a metrics layer ready for a dashboard. This is the core of the toolkit and the best place to start.

### [Email Saver](Email-Saver/)

An optional, standalone script that automatically saves application acknowledgements and rejections from Gmail as dated PDFs in Google Drive. The tracker records what happens to each application; the evidence saver keeps the proof. It also includes a backfill, so it can build a record from emails already in your inbox, even if you have not been tracking until now.

## Which do I need?

- **To organise and measure your search**, use the tracker.
- **To keep a complete record of applications and outcomes**, add the evidence saver.
- **If you have not been tracking at all**, start with the evidence saver's backfill to capture what you have already done, then use the tracker going forward.

The two are deliberately kept separate. The tracker only needs access to its own sheet, while the evidence saver needs access to your Gmail and Drive, so it is entirely opt-in. Both run inside your own Google account, and no data is sent anywhere else.

## Repository structure

    Application-Tracking-Toolkit/
    ├── README.md
    ├── Application-Tracker/
    │   ├── README.md
    │   ├── apps-script.gs
    │   └── Application Tracker Template Published.xlsx
    └── Email-Saver/
        ├── README.md
        └── email-saver.gs

## Companion project

This pairs with my [job search automation](https://github.com/Mikem9693/job-search-automation) repository. That workflow finds and triages roles and drafts applications; this toolkit records and reports on what happens to them. Together they run the full search as one system: sourcing and triage at the front, pipeline, reporting and evidence at the back.

## A note on scope

This is shared as a working set of tools and as an example of how I approach delivery: take a repetitive, easily mismanaged process, give it a clear pipeline, automate the upkeep, and build in the reporting that keeps it honest. It solved a real problem for me, and it is offered here in case it is useful to you.
