// Google Sheets APIへのリクエストサンプルです

const path = require( 'path' );
const { google } = require( 'googleapis' );

( async () => {
  // 認証する
  const authClient = await google.auth.getClient( {
    keyFile: path.resolve( `${__dirname}/../credentials/sheets.json` ),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  } );
  const sheets = google.sheets( { version: 'v4', auth: authClient } );

  // 保存するデータ
  const cells = [
    [ 1, 2, 3 ],
    [ 4, 5, 6 ]
  ];

  // 書き込み
  const req = {
    //スプレッドシートのID
    // https://docs.google.com/spreadsheets/d/{{ここの部分}}/edit#gid=0
    spreadsheetId: '{{SPREAD_SHEET_ID}}', 
    range: `シート1!A:AZ`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: cells
    }
  };
  await sheets.spreadsheets.values.append( req );
} )();