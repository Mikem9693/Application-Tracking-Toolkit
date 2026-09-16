/**
 * Job Search Tracker - automation
 *
 * Two functions keep the application pipeline current:
 *   updateStatus()    - sets each application's Status from its Pass Sift value
 *   updatePassSift()  - marks applications as not passed once they have been
 *                       silent for two weeks (no interview, no sift result)
 *
 * These are bound to the tracker sheet and copy across automatically when the
 * sheet is copied. The first time you run either function, Google will ask you
 * to authorise it. This is standard for any Apps Script and it only runs inside
 * your own copy of the sheet.
 *
 * The functions look up columns by header name, so the following headers must
 * exist exactly as written on the tracker tab:
 *   Application Date, Job Title, Status, Pass Sift, First Interview
 * The tab itself must be named 'Application Tracker 2026'. If you rename the
 * tab or any of those headers, update the matching name below.
 */

function updateStatus() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Application Tracker 2026');

  if (!sheet) {
    SpreadsheetApp.getUi().alert('Could not find sheet "Application Tracker 2026". Please check the sheet name matches exactly.');
    return;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const jobTitleCol = headers.indexOf('Job Title');
  const statusCol = headers.indexOf('Status');
  const passSiftCol = headers.indexOf('Pass Sift');

  if (jobTitleCol === -1 || statusCol === -1 || passSiftCol === -1) {
    SpreadsheetApp.getUi().alert('Could not find required columns. Please check column names match exactly.');
    return;
  }

  for (let i = 1; i < data.length; i++) {
    const jobTitle = data[i][jobTitleCol];
    const status = data[i][statusCol];
    const passSift = data[i][passSiftCol];

    if (!jobTitle || jobTitle === '') continue;

    // Skip any rows manually set to Closed
    if (status === 'Closed') continue;

    if (passSift === 'Yes') {
      sheet.getRange(i + 1, statusCol + 1).setValue('Ongoing');
    } else if (passSift === 'No') {
      sheet.getRange(i + 1, statusCol + 1).setValue('Closed');
    } else if (status === '') {
      sheet.getRange(i + 1, statusCol + 1).setValue('Waiting');
    }
  }
}

function updatePassSift() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Application Tracker 2026');

  if (!sheet) {
    SpreadsheetApp.getUi().alert('Could not find sheet "Application Tracker 2026". Please check the sheet name matches exactly.');
    return;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const appDateCol = headers.indexOf('Application Date');
  const firstInterviewCol = headers.indexOf('First Interview');
  const passSiftCol = headers.indexOf('Pass Sift');

  if (appDateCol === -1 || firstInterviewCol === -1 || passSiftCol === -1) {
    SpreadsheetApp.getUi().alert('Could not find required columns. Please check column names match exactly.');
    return;
  }

  const today = new Date();
  const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;

  for (let i = 1; i < data.length; i++) {
    const appDate = data[i][appDateCol];
    const firstInterview = data[i][firstInterviewCol];
    const passSift = data[i][passSiftCol];

    if (!appDate || !(appDate instanceof Date)) continue;

    if (passSift === '' && firstInterview === '' && (today - appDate) >= twoWeeksMs) {
      sheet.getRange(i + 1, passSiftCol + 1).setValue('No');
    }
  }
}
