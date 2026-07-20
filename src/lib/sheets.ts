import { StudentRegistration, GoogleSheetConfig } from '../types';

/**
 * Creates a new Google Spreadsheet with specific headers and styling.
 */
export async function createRegistrationSpreadsheet(accessToken: string): Promise<GoogleSheetConfig> {
  const title = 'Pendaftaran Ekstrakurikuler Sepakbola SDN Ulujami 06 Pagi';
  
  // 1. Create Spreadsheet
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: title
      },
      sheets: [
        {
          properties: {
            title: 'Pendaftar',
            gridProperties: {
              frozenRowCount: 1,
              columnCount: 15
            }
          }
        }
      ]
    })
  });

  if (!createResponse.ok) {
    const errorDetails = await createResponse.text();
    console.error('Failed to create spreadsheet:', errorDetails);
    throw new Error('Gagal membuat Spreadsheet baru di Google Drive Anda.');
  }

  const spreadsheet = await createResponse.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const spreadsheetUrl = spreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Set Headers
  const headers = [
    'Waktu Pendaftaran',
    'ID Pendaftaran',
    'Tipe Pendaftaran',
    'Nama Lengkap',
    'Tempat Lahir',
    'Tanggal Lahir',
    'Kelas',
    'Tinggi Badan (cm)',
    'Berat Badan (kg)',
    'Pernyataan Kesediaan'
  ];

  const headersResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Pendaftar!A1:J1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: 'Pendaftar!A1:J1',
        majorDimension: 'ROWS',
        values: [headers]
      })
    }
  );

  if (!headersResponse.ok) {
    const errorDetails = await headersResponse.text();
    console.error('Failed to write spreadsheet headers:', errorDetails);
    throw new Error('Gagal menginisialisasi kolom header pada Spreadsheet.');
  }

  // 3. Optional: Apply header styling (green theme) via batchUpdate
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: spreadsheet.sheets[0].properties.sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 10
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.06, // Emerald dark green #10b981 / rgb(16, 185, 129) -> Red: 0.06, Green: 0.73, Blue: 0.51
                    green: 0.60,
                    blue: 0.35
                  },
                  textFormat: {
                    foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                    bold: true,
                    fontSize: 11
                  },
                  horizontalAlignment: 'CENTER'
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: spreadsheet.sheets[0].properties.sheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 10
              }
            }
          }
        ]
      })
    });
  } catch (styleErr) {
    console.warn('Could not style headers, but spreadsheet was created successfully:', styleErr);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title
  };
}

/**
 * Appends a student registration details to the configured spreadsheet.
 */
export async function appendRegistrationToSheet(
  spreadsheetId: string,
  registration: StudentRegistration,
  accessToken: string
): Promise<boolean> {
  const rowData = [
    registration.registeredAt,
    registration.id,
    registration.registrationType === 'baru' ? 'Pendaftaran Baru' : 'Daftar Ulang',
    registration.fullName,
    registration.birthPlace,
    registration.birthDate,
    `${registration.classNumber}-${registration.classLetter}`,
    registration.height,
    registration.weight,
    registration.agreedToTerms ? 'Ya, Bersedia' : 'Tidak Bersedia'
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Pendaftar!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        majorDimension: 'ROWS',
        values: [rowData]
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to append registration row:', errorText);
    throw new Error(`Gagal menyimpan ke Google Sheets: ${response.statusText}`);
  }

  return true;
}

/**
 * Checks if a spreadsheet is valid and has our "Pendaftar" sheet.
 */
export async function validateSpreadsheet(spreadsheetId: string, accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    const sheets = data.sheets || [];
    return sheets.some((s: any) => s.properties?.title === 'Pendaftar');
  } catch (error) {
    console.error('Spreadsheet validation error:', error);
    return false;
  }
}
