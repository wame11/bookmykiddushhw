# Google Apps Script Deployment Guide

This guide will help you deploy the Apps Script backend for the Book My Kiddush booking system.

## Prerequisites

- A Google account with access to Google Sheets and Google Apps Script
- The `Code.gs` file from this repository

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Kiddush Bookings" (or any name you prefer)
4. Note the **Sheet ID** from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
   - Example: If URL is `https://docs.google.com/spreadsheets/d/1abc123xyz/edit`
   - Then Sheet ID is: `1abc123xyz`

## Step 2: Set Up Google Apps Script

1. In your Google Sheet, click **Extensions** > **Apps Script**
2. Delete any existing code in the editor
3. Copy the entire contents of `Code.gs` from this repository
4. Paste it into the Apps Script editor
5. Update the `SHEET_ID` constant at the top:
   ```javascript
   const SHEET_ID = "YOUR_SHEET_ID_HERE";  // Replace with your actual Sheet ID
   ```

## Step 3: Initialize the Sheet

1. In the Apps Script editor, select the `setupSheet` function from the dropdown
2. Click the **Run** button (▶️)
3. If prompted, click **Review permissions**
4. Sign in with your Google account
5. Click **Advanced** > **Go to [Your Project Name] (unsafe)**
6. Click **Allow**
7. Check the execution log (View > Logs) to confirm "Bookings sheet created successfully"
8. Go back to your spreadsheet - you should now see a "Bookings" tab with headers

## Step 4: Deploy as Web App

1. In the Apps Script editor, click **Deploy** > **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Select **Web app**
4. Configure the deployment:
   - **Description**: "Kiddush Booking API" (or any description)
   - **Execute as**: **Me** (your-email@gmail.com)
   - **Who has access**: **Anyone**
5. Click **Deploy**
6. Copy the **Web app URL** that appears
   - It will look like: `https://script.google.com/macros/s/AKfycb.../exec`

## Step 5: Update Frontend

1. Open `index.html` in this repository
2. Find the `SCRIPT_URL` constant (around line 190):
   ```javascript
   const SCRIPT_URL = "https://script.google.com/macros/s/...";
   ```
3. Replace it with your new Web app URL from Step 4
4. Save the file
5. Commit and push the changes to GitHub

## Step 6: Test the Integration

### Test Backend Directly

1. In Apps Script editor, select `testDoGet` function
2. Click Run ▶️
3. Check logs (View > Logs) - should show empty array `[]` initially
4. Select `testDoPost` function
5. Click Run ▶️
6. Check logs - should show success message
7. Check your spreadsheet - should have a test booking row
8. Run `testDoGet` again - should now show the test booking

### Test Frontend

1. Open your GitHub Pages site (usually `https://yourusername.github.io/bookmykiddushhw/`)
2. The calendar should load without errors (check browser console with F12)
3. Try booking a date:
   - Select an available Saturday
   - Fill in the form
   - Click "Reserve date"
   - Should see success message
4. Refresh the page - the date should now show as "Booked"
5. Check your email - should receive confirmation
6. Check office email - should receive notification
7. Check spreadsheet - should have the new booking

## Troubleshooting

### Calendar shows no booked dates
- **Problem**: `doGet()` endpoint not working
- **Solution**: 
  - Check deployment is set to "Anyone" access
  - Verify SCRIPT_URL in index.html matches deployment URL
  - Check browser console for CORS errors
  - Check Apps Script logs for errors

### Bookings don't save
- **Problem**: `doPost()` endpoint not working
- **Solution**:
  - Verify SHEET_ID is correct in Code.gs
  - Check "Bookings" sheet exists with proper headers
  - Check Apps Script logs for errors
  - Verify deployment has "Anyone" access

### Emails not sending
- **Problem**: Email delivery fails
- **Solution**:
  - Verify email addresses are correct in Code.gs
  - Check Apps Script quotas (100 emails/day for free accounts)
  - Check Gmail spam folder
  - Review Apps Script logs for email errors

### Duplicate bookings allowed
- **Problem**: Date checking not working
- **Solution**:
  - Verify date format in spreadsheet matches YYYY-MM-DD
  - Check `normalizeDate()` function is working
  - Clear localStorage in browser and refresh

## Updating the Deployment

If you make changes to the Apps Script code:

1. Save your changes in the Apps Script editor
2. Click **Deploy** > **Manage deployments**
3. Click the pencil icon ✏️ next to your deployment
4. Change the version to **New version**
5. Add a description of your changes
6. Click **Deploy**
7. The URL remains the same - no need to update frontend

## Security Notes

- The Apps Script runs with "Execute as: Me" permissions
- Only you can view the actual spreadsheet data
- The web app endpoint is public but doesn't expose sensitive data
- Consider adding rate limiting if you experience spam bookings
- The amount field is only visible in emails to you and the user

## Support

For issues with:
- **Frontend code**: Create an issue in this GitHub repository
- **Google Apps Script**: Check [Apps Script documentation](https://developers.google.com/apps-script)
- **Email delivery**: Check [MailApp quotas](https://developers.google.com/apps-script/guides/services/quotas)

## Advanced Configuration

### Custom Email Template

Edit the `sendEmails_()` function in Code.gs to customize email content.

### Additional Validation

Add custom validation in the `doPost()` function before saving bookings.

### Different Sheet Name

Change the `SHEET_NAME` constant if you want to use a different sheet name.

### Multiple Synagogues

Modify the code to support multiple synagogues by adding a filter parameter.
