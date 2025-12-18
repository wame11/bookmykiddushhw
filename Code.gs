/**
 * Book My Kiddush - Google Apps Script Backend
 * 
 * This script handles booking submissions and retrieval for the Kiddush booking system.
 * Deploy as a Web App with "Anyone" access to allow the frontend to communicate.
 * 
 * Required Setup:
 * 1. Create a Google Sheet with a "Bookings" tab
 * 2. Set up the sheet with columns: Date | Name | Email | Amount | Dedication | Synagogue | Timestamp
 * 3. Update SHEET_ID constant below with your Google Sheet ID
 * 4. Deploy as Web App: Deploy > New deployment > Select type: Web app
 * 5. Execute as: Me
 * 6. Who has access: Anyone
 * 7. Update SCRIPT_URL in index.html with the deployment URL
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

// TODO: Replace with your Google Sheet ID
const SHEET_ID = "YOUR_SHEET_ID_HERE";
const SHEET_NAME = "Bookings";

// Email configuration
const OFFICE_EMAIL = "office@hwjc.org.uk";
const SYNAGOGUE_NAME = "Hadley Wood Shul";

// ============================================================================
// MAIN HANDLERS
// ============================================================================

/**
 * Handles GET requests - returns all bookings as JSON
 * This allows the frontend calendar to display booked dates
 */
function doGet(e) {
  try {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return createJsonResponse({
        status: "error",
        message: "Bookings sheet not found"
      }, 404);
    }
    
    var data = sheet.getDataRange().getValues();
    var bookings = [];
    
    // Skip header row (index 0), process data rows
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      
      // Skip empty rows
      if (!row[0]) continue;
      
      bookings.push({
        date: normalizeDate(row[0]),
        name: row[1] || "",
        email: row[2] || "",
        amount: row[3] || "",
        dedication: row[4] || "",
        synagogue: row[5] || ""
      });
    }
    
    return createJsonResponse(bookings);
    
  } catch (error) {
    Logger.log("Error in doGet: " + error.toString());
    return createJsonResponse({
      status: "error",
      message: "Failed to retrieve bookings: " + error.toString()
    }, 500);
  }
}

/**
 * Handles POST requests - saves new bookings
 */
function doPost(e) {
  try {
    // Parse the request body
    var payload = JSON.parse(e.postData.contents);
    
    // Validate required fields
    if (!payload.date || !payload.name || !payload.email || !payload.amount) {
      return createJsonResponse({
        status: "error",
        message: "Missing required fields"
      }, 400);
    }
    
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return createJsonResponse({
        status: "error",
        message: "Bookings sheet not found"
      }, 404);
    }
    
    // Check for duplicate booking on the same date
    var existingBookings = sheet.getDataRange().getValues();
    var normalizedDate = normalizeDate(payload.date);
    
    for (var i = 1; i < existingBookings.length; i++) {
      var existingDate = normalizeDate(existingBookings[i][0]);
      if (existingDate === normalizedDate) {
        return createJsonResponse({
          status: "error",
          message: "This date is already booked"
        }, 409);
      }
    }
    
    // Add new booking to sheet
    var timestamp = new Date();
    sheet.appendRow([
      payload.date,
      payload.name,
      payload.email,
      payload.amount,
      payload.dedication || "",
      payload.synagogue || SYNAGOGUE_NAME,
      timestamp
    ]);
    
    // Send confirmation emails
    sendEmails_(payload);
    
    return createJsonResponse({
      status: "success",
      message: "Booking saved successfully"
    });
    
  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
    return createJsonResponse({
      status: "error",
      message: "Failed to save booking: " + error.toString()
    }, 500);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalizes date to YYYY-MM-DD format
 * Handles various input formats including Date objects, ISO strings, and DD/MM/YYYY
 */
function normalizeDate(val) {
  if (val === null || val === undefined) return "";
  
  var s = String(val).trim();
  if (!s) return "";
  
  // Already in correct format
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  
  // ISO datetime format - extract date part
  if (s.length > 10 && s.charAt(10) === 'T') return s.substring(0, 10);
  
  // Remove leading apostrophe if present (from spreadsheet text formatting)
  var cleaned = s.charAt(0) === "'" ? s.substring(1).trim() : s;
  
  // Handle DD/MM/YYYY or D/M/YYYY format
  var ukMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ukMatch) {
    var day = Number(ukMatch[1]);
    var month = Number(ukMatch[2]);
    var year = Number(ukMatch[3]);
    
    if (year && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return formatISODate(year, month, day);
    }
  }
  
  // Try parsing as Date object
  var date = new Date(cleaned);
  if (!isNaN(date.getTime())) {
    return formatISODate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }
  
  return "";
}

/**
 * Formats date components as YYYY-MM-DD
 */
function formatISODate(year, month, day) {
  return year + "-" + padZero(month) + "-" + padZero(day);
}

/**
 * Pads single digit numbers with leading zero
 */
function padZero(num) {
  return String(num).padStart(2, "0");
}

/**
 * Creates a JSON response with appropriate headers
 */
function createJsonResponse(data, statusCode) {
  var response = ContentService.createTextOutput(JSON.stringify(data));
  response.setMimeType(ContentService.MimeType.JSON);
  
  if (statusCode) {
    // Note: Apps Script doesn't directly support HTTP status codes in responses
    // The status is included in the JSON payload instead
    data.httpStatus = statusCode;
  }
  
  return response;
}

/**
 * Sends confirmation emails to user and office
 * This is the complete version with all booking details
 */
function sendEmails_(payload) {
  try {
    // Format the booking details
    var dateFormatted = formatDateForEmail(payload.date);
    var dedication = payload.dedication ? payload.dedication : "None";
    var amountDisplay = payload.amount === "To be discussed with Chantel" 
      ? "To be discussed with office" 
      : "£" + payload.amount;
    
    // Email to the user
    var userSubject = "Kiddush Booking Confirmation - " + dateFormatted;
    var userBody = 
      "Dear " + payload.name + ",\n\n" +
      "Thank you for booking a Kiddush sponsorship at " + SYNAGOGUE_NAME + ".\n\n" +
      "Booking Details:\n" +
      "Date: " + dateFormatted + "\n" +
      "Name: " + payload.name + "\n" +
      "Email: " + payload.email + "\n" +
      "Amount: " + amountDisplay + "\n" +
      "Dedication: " + dedication + "\n" +
      "Synagogue: " + (payload.synagogue || SYNAGOGUE_NAME) + "\n\n" +
      "If you need to make any changes or have questions, please contact the office at " + OFFICE_EMAIL + ".\n\n" +
      "Best regards,\n" +
      SYNAGOGUE_NAME;
    
    MailApp.sendEmail(payload.email, userSubject, userBody);
    
    // Email to the office
    var officeSubject = "New Kiddush Booking - " + dateFormatted;
    var officeBody = 
      "A new Kiddush booking has been received:\n\n" +
      "Date: " + dateFormatted + "\n" +
      "Name: " + payload.name + "\n" +
      "Email: " + payload.email + "\n" +
      "Amount: " + amountDisplay + "\n" +
      "Dedication: " + dedication + "\n" +
      "Synagogue: " + (payload.synagogue || SYNAGOGUE_NAME) + "\n\n" +
      "This booking has been automatically added to the spreadsheet.";
    
    MailApp.sendEmail(OFFICE_EMAIL, officeSubject, officeBody);
    
    Logger.log("Emails sent successfully for booking: " + payload.date);
    
  } catch (error) {
    Logger.log("Error sending emails: " + error.toString());
    // Don't throw error - booking should still be saved even if emails fail
  }
}

/**
 * Formats date for email display
 */
function formatDateForEmail(dateStr) {
  try {
    var date = new Date(dateStr);
    var options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'Europe/London'
    };
    return date.toLocaleDateString('en-GB', options);
  } catch (error) {
    return dateStr;
  }
}

// ============================================================================
// SETUP AND TESTING FUNCTIONS
// ============================================================================

/**
 * Creates the Bookings sheet with proper headers if it doesn't exist
 * Run this function once to set up your spreadsheet
 */
function setupSheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Date", "Name", "Email", "Amount", "Dedication", "Synagogue", "Timestamp"]);
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold");
    Logger.log("Bookings sheet created successfully");
  } else {
    Logger.log("Bookings sheet already exists");
  }
}

/**
 * Test function to verify doGet works correctly
 */
function testDoGet() {
  var result = doGet({});
  Logger.log(result.getContent());
}

/**
 * Test function to verify doPost works correctly
 */
function testDoPost() {
  var testPayload = {
    date: "2025-12-25",
    name: "Test User",
    email: "test@example.com",
    amount: "200.00",
    dedication: "In memory of...",
    synagogue: SYNAGOGUE_NAME
  };
  
  var e = {
    postData: {
      contents: JSON.stringify(testPayload)
    }
  };
  
  var result = doPost(e);
  Logger.log(result.getContent());
}
