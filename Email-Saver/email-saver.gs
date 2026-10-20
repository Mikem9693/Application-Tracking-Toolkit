/**
 * Job Search Tracker - email evidence saver
 *
 * A standalone companion script that saves job application emails from Gmail
 * as dated PDFs in Google Drive:
 *   acknowledgementRun()  - saves new application acknowledgements
 *   rejectionRun()        - saves new rejections, kept in a separate folder
 *   backfillAll()         - one-off capture of emails already in your inbox;
 *                           continues automatically until complete
 *   stopBackfill()        - cancels a backfill in progress
 *
 * This is a standalone script, kept separate from the tracker so that copying
 * the tracker never asks for access to your Gmail. Create it as a new project
 * at script.google.com. The first time you run it, Google will ask you to
 * authorise access to Gmail and Drive. It only ever runs inside your own
 * Google account and sends no data anywhere else.
 *
 * Update the settings below before first use.
 */

// ===== Settings: change these to suit =====
const ROOT_PATH = ['Job Applications'];       // folder path inside My Drive
const BACKFILL_FROM = new Date(2026, 0, 1);   // date to backfill from (year, month 0-11, day)
const DATE_FORMAT = 'dd-MM-yy';               // used in file names (avoid "/" in file names)
const TZ = Session.getScriptTimeZone();       // follows Project Settings > Time zone

const ACK_FOLDER = 'Application Acknowledgements';  // subfolder for acknowledgements
const ACK_PREFIX = 'Application Acknowledgement';   // file name: [prefix] - [company] - [date]
const REJ_FOLDER = 'Application Rejections';        // subfolder for rejections
const REJ_PREFIX = 'Application Rejection';         // file name: [prefix] - [company] - [date]

// ===== Matching rules =====
const EXCLUDE = '-category:promotions -category:social';

const REJECTION = /unfortunately[^.]{0,120}\b(not|unable|won't|will not)\b|unsuccessful|not been successful|not to progress|not be progressing|not to proceed|not be proceeding|not moving forward|not be moving forward|move forward with other|other candidates|regret to inform|position has (now )?been filled|no longer under consideration/i;

// Senders that are recruitment systems or job boards rather than the employer
const GENERIC_SENDERS = /workday|greenhouse|lever|ashby|smartrecruiters|workable|teamtailor|pinpoint|recruitee|bamboo|icims|taleo|successfactors|jobvite|linkedin|indeed|no-?reply|notification/i;
const NAME_SUFFIXES = /\s*[-|]?\s*(careers?|recruiting|recruitment|talent acquisition|talent team|talent|hiring team|hiring|jobs|people team|hr|team)\s*$/i;

// ===== Acknowledgements =====
const ACK = {
  folder: ACK_FOLDER,
  prefix: ACK_PREFIX,
  memory: 'ACK_', // internal label: do not change after first run
  query: 'newer_than:2d subject:(application OR applying OR applied OR candidacy OR interest) ' + EXCLUDE +
    ' -subject:(alert OR "jobs for you" OR recommended OR "new jobs" OR "is hiring" OR newsletter)',
  matches: function (msg) {
    if (!/applica|applying|applied|candidacy|interest/i.test(msg.getSubject())) return false;
    return !REJECTION.test(msg.getSubject() + ' ' + msg.getPlainBody()); // rejections handled separately
  }
};

function acknowledgementRun() { process_(ACK); }

// ===== Rejections =====
const REJ = {
  folder: REJ_FOLDER,
  prefix: REJ_PREFIX,
  memory: 'REJ_', // internal label: do not change after first run
  query: 'newer_than:2d ' + EXCLUDE +
    ' (unfortunately OR unsuccessful OR "not been successful" OR "not to progress" OR "not be progressing"' +
    ' OR "not to proceed" OR "not moving forward" OR "other candidates" OR "regret to inform"' +
    ' OR "been filled" OR "no longer under consideration")',
  matches: function (msg) {
    const text = msg.getSubject() + ' ' + msg.getPlainBody();
    return REJECTION.test(text) && /applica|candida|role|position|vacanc/i.test(text);
  }
};

function rejectionRun() { process_(REJ); }

// ===== Daily processing (used by the triggers) =====
function process_(type) {
  const props = PropertiesService.getScriptProperties();

  // Record the set-up date on first run, so only emails from then onwards are saved
  if (!props.getProperty('START')) props.setProperty('START', String(Date.now()));
  const startDate = new Date(Number(props.getProperty('START')));

  const folder = getFolder_(ROOT_PATH.concat([type.folder]));
  for (const thread of GmailApp.search(type.query)) {
    for (const msg of thread.getMessages()) {
      const key = type.memory + msg.getId();
      if (props.getProperty(key)) continue; // already saved
      if (msg.getDate() < startDate || !type.matches(msg)) continue;
      savePdf_(msg, folder, type.prefix);
      props.setProperty(key, '1');
    }
  }
}

// ===== One-off backfill of existing emails =====
// Run backfillAll once by hand. It reschedules itself until finished, then tidies up.
function backfillAll() {
  clearBackfillTriggers_(); // remove the trigger that started this run, if any
  const started = Date.now();

  for (const type of [ACK, REJ]) {
    const finished = backfill_(type, started);
    if (!finished) {
      // Out of time: schedule the next run in one minute and stop here
      ScriptApp.newTrigger('backfillAll').timeBased().after(60 * 1000).create();
      console.log('Paused. The next run will start automatically in about a minute.');
      return;
    }
  }
  console.log('Backfill complete for acknowledgements and rejections.');
}

function backfill_(type, started) {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('DONE_' + type.memory)) return true; // already finished this type

  const folder = getFolder_(ROOT_PATH.concat([type.folder]));
  const after = Utilities.formatDate(new Date(BACKFILL_FROM.getTime() - 86400000), TZ, 'yyyy/MM/dd');
  const query = type.query.replace('newer_than:2d', 'after:' + after);
  const posKey = 'POS_' + type.memory;

  // Resume a little before where the last run stopped, in case new emails have shifted the list
  let start = Math.max(0, Number(props.getProperty(posKey) || 0) - 20);
  let saved = 0, threads;

  do {
    threads = GmailApp.search(query, start, 100);
    for (const thread of threads) {
      for (const msg of thread.getMessages()) {
        // Stop before Google's six-minute limit, recording where to resume
        if (Date.now() - started > 5 * 60 * 1000) {
          props.setProperty(posKey, String(start));
          console.log(type.prefix + ': saved ' + saved + ' on this run, more to do.');
          return false;
        }
        const key = type.memory + msg.getId();
        const seen = 'SEEN_' + key;
        if (props.getProperty(key) || props.getProperty(seen)) continue; // already handled
        if (msg.getDate() < BACKFILL_FROM) continue;

        if (type.matches(msg)) {
          savePdf_(msg, folder, type.prefix);
          props.setProperty(key, '1');
          saved++;
        } else {
          props.setProperty(seen, '1'); // checked and not relevant, so skip next time
        }
      }
      start++; // this thread is finished
    }
  } while (threads.length === 100);

  props.setProperty('DONE_' + type.memory, '1');
  props.deleteProperty(posKey);
  console.log(type.prefix + ': complete. Saved ' + saved + ' on this run.');
  return true;
}

function clearBackfillTriggers_() {
  for (const t of ScriptApp.getProjectTriggers()) {
    if (t.getHandlerFunction() === 'backfillAll') ScriptApp.deleteTrigger(t);
  }
}

// Run by hand to cancel a backfill in progress
function stopBackfill() {
  clearBackfillTriggers_();
  console.log('Backfill stopped. Run backfillAll to resume from where it left off.');
}

// ===== Save as PDF =====
function savePdf_(msg, folder, prefix) {
  const subject = msg.getSubject() || '(no subject)';
  const company = clean_(companyName_(msg));
  const date = Utilities.formatDate(msg.getDate(), TZ, DATE_FORMAT);
  const name = prefix + ' - ' + company + ' - ' + date;

  const header =
    '<p style="font-family:Arial;font-size:11px">' +
    '<b>From:</b> ' + esc_(msg.getFrom()) + '<br>' +
    '<b>To:</b> ' + esc_(msg.getTo()) + '<br>' +
    '<b>Date:</b> ' + Utilities.formatDate(msg.getDate(), TZ, 'dd/MM/yyyy HH:mm') + '<br>' +
    '<b>Subject:</b> ' + esc_(subject) + '</p><hr>';

  const pdf = Utilities.newBlob(header + msg.getBody(), 'text/html', name + '.html')
    .getAs('application/pdf').setName(name + '.pdf');
  folder.createFile(pdf);
}

// ===== Work out the company name =====
function companyName_(msg) {
  const from = msg.getFrom(); // e.g. "Meta Careers <careers@meta.com>"

  // 1. Sender's display name, e.g. "Stripe Recruiting" becomes "Stripe"
  let display = ((from.match(/^"?([^"<]*)"?\s*</) || [])[1] || '').trim();
  const atMatch = display.match(/\bat\s+(.+)$/i); // e.g. "Talent Team at Monzo"
  if (atMatch) display = atMatch[1];
  display = display.replace(NAME_SUFFIXES, '').replace(NAME_SUFFIXES, '').trim();
  if (display && !GENERIC_SENDERS.test(display)) return display;

  // 2. Subject line, e.g. "Thank you for applying to Meta" or "Project Manager at HSBC"
  const subject = msg.getSubject() || '';
  for (const word of ['at', 'with', 'to', 'in', 'from']) {
    const idx = subject.toLowerCase().lastIndexOf(' ' + word + ' ');
    if (idx === -1) continue;
    const candidate = subject.slice(idx + word.length + 2)
      .split(/[!:,|(]|\s-\s|\.\s|\.$|\s+for\s/i)[0].trim();
    if (candidate && candidate.length <= 40 &&
