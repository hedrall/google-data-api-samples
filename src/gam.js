// GAM のAPIの利用例です

const path = require( 'path' );
const { auth } = require( 'google-auth-library' );
const axios = require( 'axios' );
const { js2xml, xml2js } = require( 'xml-js' );

// SOAPのベース
// soapenv:Body部分を色々変える
const soapJsonBase = {
  _declaration: {
    _attributes: {
      version: '1.0',
      encoding: 'UTF-8'
    }
  },
  'soapenv:Envelope': {
    _attributes: {
      'xmlns:soapenv': 'http://schemas.xmlsoap.org/soap/envelope/',
      'xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance'
    },
    'soapenv:Header': {
      'ns1:RequestHeader': {
        _attributes: {
          'soapenv:actor': 'http://schemas.xmlsoap.org/soap/actor/next',
          'soapenv:mustUnderstand': '0',
          // APIのバージョンはここで指定
          'xmlns:ns1': `https://www.google.com/apis/ads/publisher/v202002`
        },
        'ns1:networkCode': {
          _text: '{{ GAMのネットワークIDを指定 }}'
        },
        'ns1:applicationName': {
          _text: '{{ GCPのプロジェクト名を指定 }}'
        }
      }
    },
    'soapenv:Body': undefined
  }
};
( async () => {
  // --- クエリの作成 ---
  // 日時と広告ユニットごとの合計のインプレッションを取得
  const query = {
    // ディメンジョン
    dimensions: [
      { _text: 'DATE' },
      { _text: 'AD_UNIT_NAME' }, // 広告ユニット
    ],
    adUnitView: { _text: 'FLAT' },
    // 指標
    columns: [
      // 全体系
      { _text: 'TOTAL_LINE_ITEM_LEVEL_IMPRESSIONS' }, // 合計のインプレッション
    ],
    // レポートの期間
    startDate: {
      year: { _text: '2020' },
      month: { _text: '4' },
      day: { _text: '1' }
    },
    endDate: {
      year: { _text: '2020' },
      month: { _text: '4' },
      day: { _text: '2' }
    },
    // 日時範囲の期間は「固定」
    dateRangeType: {
      _text: 'CUSTOM_DATE'
    },
    // フィルターをかける場合は以下の様に記述
    //statement: {
    //  query: {
    //    _text: ` where PARENT_AD_UNIT_ID = {{広告ユニットID}}`
    //  }
    //},
    // 管理画面とタイムゾーンを合わせる
    timeZoneType: {
      _text: 'PUBLISHER'
    }
  };
  // --- クエリの作成 ---

  // --- アクセストークンを取得 ---
  const keys = require( path.resolve( `${__dirname}/../credentials/gam.json` ) );
  const client = auth.fromJSON( keys );
  client.scopes = ['https://www.googleapis.com/auth/dfp', 'https://www.googleapis.com/auth/analytics.readonly'];
  await client.authorize();
  const token = client.credentials.access_token;
  // --- クエリの作成 ---
  
  // SOAPヘッダーに変換するオブジェクトを作成
  // xml-jsでXMLに変換する
  // 変換後↓
  // <runReportJob xmlns="https://www.google.com/apis/ads/publisher/v202002">
  //   <reportJob>
  //     <reportQuery> クエリー </reportQuery>
  //   </reportJob>
  // <runReportJob>
  let soapJson = { ...soapJsonBase };
  let body = {
    // ここで実行するコマンドを指定
    runReportJob: {
      // 中身はコマンドの引数
      _attributes: {
        xmlns: `https://www.google.com/apis/ads/publisher/v202002`
      },
      reportJob: {
        reportQuery: query
      }
    }
  };
  soapJson['soapenv:Envelope']['soapenv:Body'] = body;
  
  // APIリクエストを実行
  let soapXML = js2xml( soapJson, { compact: true } );
  let response = await axios.post(
      `https://ads.google.com/apis/ads/publisher/v202002/ReportService`,
      soapXML,
      { headers: { Authorization: `Bearer ${token}` } }
    );

  // レスポンスもXMLなのでjsonに変換する
  let data = xml2js( response.data, { compact: true } );
  const jobId = data['soap:Envelope']['soap:Body']['runReportJobResponse']['rval']['id']['_text'];
  console.log( 'ジョブID', jobId );
  
  // ジョブの完了をポーリングする
  const sleep = () => new Promise( resolve => setTimeout( () => resolve(), 1000 ) ); 
  while ( true ) {
    console.log( 'ポーリング' );
    soapJson = { ...soapJsonBase };
    body = {
      getReportJobStatus: {
        _attributes: {
          xmlns: `https://www.google.com/apis/ads/publisher/v202002`
        },
        reportJobId: { _text: jobId }
      }
    };
    soapJson['soapenv:Envelope']['soapenv:Body'] = body;
    // APIリクエスト実行
    soapXML = js2xml( soapJson, { compact: true } );
    response = await axios.post(
      `https://ads.google.com/apis/ads/publisher/v202002/ReportService`,
      soapXML,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    data = xml2js( response.data, { compact: true } );
    // ステータスを取得
    const status =  data['soap:Envelope']['soap:Body']['getReportJobStatusResponse']['rval']['_text'];
    console.log( 'ステータス', status );
    if ( [ 'COMPLETED', 'FAILED' ].includes( status ) ) {
      console.log( '完了' );
      break;
    }
    await sleep();
  }
  
  // レポートのダウンロード用URLを取得する
  console.log( 'URLを取得' );
  soapJson = { ...soapJsonBase };
  body = {
    getReportDownloadURL: {
      _attributes: {
        xmlns: `https://www.google.com/apis/ads/publisher/v202002`
      },
      reportJobId: { _text: jobId },
      exportFormat: { _text: 'CSV_DUMP' },
    }
  };
  soapJson['soapenv:Envelope']['soapenv:Body'] = body;
  // APIリクエスト実行
  soapXML = js2xml( soapJson, { compact: true } );
  response = await axios.post(
    `https://ads.google.com/apis/ads/publisher/v202002/ReportService`,
    soapXML,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  data = xml2js( response.data, { compact: true } );
  const downloadURL = data['soap:Envelope']['soap:Body']['getReportDownloadURLResponse']['rval']['_text'];
  console.log( downloadURL );
  
  // ダウンロード
  const fs = require( 'fs' );
  const request = require( 'request' );
  await new Promise( ( resolve ) => {
    request( downloadURL )
      .pipe( fs.createWriteStream( 'report.csv.gz' ) )
      .on( 'close', async () => {
        resolve();
      } );
  } );
  
  // gzipなので、解答する
  const child_process = require( 'child_process' );
  await child_process.execSync( `gunzip -f ./report.csv.gz` );
  
} )().catch( e => console.log( e ) );