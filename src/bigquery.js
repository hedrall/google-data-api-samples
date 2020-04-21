// BigQueryのAPIの利用例です

const path = require( 'path' );

( async () => {
  // クライアントを初期化
  const { BigQuery } = require( '@google-cloud/bigquery' );
  const bigquery = new BigQuery( {
    // 認証はクレデンシャルファイルを渡すだけでいい
    keyFilename: path.resolve( `${__dirname}/../credentials/bq.json` ),
    projectId: '{{ プロジェクト名を入力 }}'
  } );

  // クエリを作成
  const query = `SELECT name
      FROM \`bigquery-public-data.usa_names.usa_1910_2013\`
      WHERE state = 'TX'
      LIMIT 100`;

  // 全てのオプションは -> https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
  const options = {
    query: query,
    location: 'US',
  };

  // ジョブを実行
  const [job] = await bigquery.createQueryJob( options );

  // ジョブの完了を待つ
  const [rows] = await job.getQueryResults();

  // 結果を表示
  console.log( 'Rows:' );
  console.table( rows );
} )();