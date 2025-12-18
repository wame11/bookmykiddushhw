# Book My Kiddush - Hadley Wood Shul

A booking system for sponsoring Kiddush at Hadley Wood Shul on Shabbat and Festival dates.

## Recent Fixes (Frontend)

The following syntax errors in the HTML/JavaScript have been fixed:

### Fixed Issues:
1. ✅ **JavaScript Syntax Errors** - Fixed all spaces in property/method access:
   - Fixed `.padStart()`, `.trim()`, `.substring()` spacing
   - Fixed `.getUTCDate()`, `.getUTCDay()`, `.getUTCFullYear()` spacing
   - Fixed `.map()`, `.filter()` spacing
   - Fixed `.disabled`, `.innerHTML`, `.classList` spacing
   - Fixed `.get()`, `.toFixed()`, `.error()`, `.message` spacing
   - Fixed `.setMonth()` spacing

2. ✅ **CSS Syntax Errors** - Fixed spacing in CSS class definitions:
   - Fixed `.card` class definition (removed space before 'card')
   - Fixed `.chip` padding value (changed `. 125rem` to `.125rem`)

3. ✅ **Email Address Errors** - Fixed email addresses:
   - Corrected `office@hwjc.org. uk` to `office@hwjc.org.uk`

4. ✅ **Number Format Errors** - Fixed number formats:
   - Changed `"200. 00"` to `"200.00"` in sponsorship options

## Required Backend Fixes (Google Apps Script)

⚠️ **IMPORTANT**: The Google Apps Script backend (hosted separately) still needs these critical fixes:

### 1. Missing `doGet()` Endpoint
**Problem**: The frontend calls `fetch(endpoint())` to retrieve bookings, but there's no `doGet()` function in the Apps Script to return the booking data from the spreadsheet. This prevents booked dates from appearing in the calendar and allows duplicate bookings.

**Required Fix**: Add a `doGet()` function to the Apps Script that:
```javascript
function doGet(e) {
  var sheet = SpreadsheetApp.openById("YOUR_SHEET_ID").getSheetByName("Bookings");
  var data = sheet.getDataRange().getValues();
  var bookings = [];
  
  // Skip header row, map data to objects
  for (var i = 1; i < data.length; i++) {
    bookings.push({
      date: data[i][0], // Assuming date is in first column
      name: data[i][1],
      email: data[i][2],
      amount: data[i][3],
      dedication: data[i][4],
      synagogue: data[i][5]
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify(bookings))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 2. Duplicate `sendEmails_()` Function
**Problem**: The Apps Script has two definitions of `sendEmails_()`. The second (incomplete) version overrides the first complete version, causing emails to be sent without dedication and other important fields.

**Required Fix**: Remove the duplicate `sendEmails_()` function definition, keeping only the complete first version that includes all booking details.

### 3. Apps Script Syntax Errors
**Problem**: Similar spacing issues may exist in the Apps Script backend code.

**Required Fix**: Check for and fix any instances of:
- `e.postData. contents` → `e.postData.contents`
- `payload. amount` → `payload.amount`
- `payload. name` → `payload.name`
- Similar spacing issues in property/method access

### 4. Date Format Consistency
**Problem**: The `doPost()` function parses dates but the sheet may store them inconsistently as text.

**Required Fix**: Ensure consistent date format (YYYY-MM-DD) is used throughout the Apps Script when:
- Saving dates to the spreadsheet
- Reading dates from the spreadsheet
- Returning dates in the `doGet()` response

## Testing After Backend Fixes

Once the backend fixes are deployed:

1. Open the calendar - dates should load from the spreadsheet
2. Already booked dates should show as "Booked"
3. Try to book a date - it should prevent duplicate bookings
4. Check that confirmation emails include all details (name, date, amount, dedication, etc.)

## Deployment

The frontend is hosted via GitHub Pages. The backend Google Apps Script needs to be deployed separately through the Google Apps Script editor.

### Deploying Apps Script Changes:
1. Make the required changes in the Apps Script editor
2. Click "Deploy" → "Manage deployments"
3. Create a new deployment or update the existing one
4. Copy the new deployment URL if it changes
5. Update the `SCRIPT_URL` constant in `index.html` if necessary

## Contact

For questions: office@hwjc.org.uk
