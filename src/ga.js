// GAのAPIの利用例です

// トークンの取得のため
const { auth } = require( 'google-auth-library' );
// HTTPリクエストにはaxiosを使用します。
const axios  = require( 'axios' );
const path = require( 'path' );

( async () => {
  // --- start OAuthアクセストークンを手に入れる ---
  // credentialファイルを読み込む
  const credentialJson = require( path.resolve( `${__dirname}/../credentials/ga.json` ) );
  
  const client = auth.fromJSON( credentialJson );
  // 許可するスコープを定義
  client.scopes = ['https://www.googleapis.com/auth/analytics.readonly'];
  await client.authorize();
  const token =  client.credentials.access_token;
  // --- end OAuthアクセストークンを手に入れる ---
  
  // --- start Queryを作成する ---
  // ブラウザに対するページビューを取得する
  const query = {
    reportRequests: [
      {
        viewId: '{{ GAのビューIDを入力 }}',
        // レポートの期間
        dateRanges: [ {
          startDate: '2020-04-01',
          endDate: '2020-04-02',
        } ],
        // ディメンジョン
        dimensions: [ { name: 'ga:browser' } ],
        // 指標
        metrics: [ { expression: 'ga:pageviews' }, ],
        // 指標のフィルターをかけたい場合は以下の様に記述する
        // dimensionFilterClauses: [
        //   {
        //     operator: 'OR',
        //     filters: [
        //       {
        //         dimensionName: 'ga:pagePath',
        //         operator: 'REGEXP', // or EXACT
        //         expressions: ['hoge']
        //       }
        //     ]
        //   }
        // ],
        
        // GAのレポートはコンソールからの操作と同様にサンプリングされる可能性があることに注意する
        samplingLevel: 'DEFAULT' 
      }
    ]
  };
  // --- end Queryを作成する ---

  // --- start リクエストを実行する ---
  const response = await axios.post(
    'https://analyticsreporting.googleapis.com/v4/reports:batchGet',
    query,
    {
      headers: {
        // アクセストークンを設定
        Authorization: `Bearer ${token}`
      }
    }
  );
  // --- start リクエストを実行する ---
  
  // 出力
  console.table( response.data.reports[0].data.rows.map( row => {
    return [ ...row.dimensions, ...row.metrics[0].values ];
  }) );
  
} )().catch( e => console.log( e ) );