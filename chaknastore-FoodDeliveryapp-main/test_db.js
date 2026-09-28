const { Client } = require('pg');
const regions = ['ap-south-1', 'us-east-1', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'us-west-1', 'us-west-2', 'us-east-2', 'ap-northeast-1', 'ap-southeast-2', 'sa-east-1', 'ca-central-1', 'eu-west-2'];

async function test() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    console.log('Trying', host);
    const client = new Client({
      host,
      port: 6543,
      user: 'postgres.narzeblpnlmnvpbfoufv',
      password: 'UR50Yq9LZNWmk9Ll',
      database: 'postgres',
      connectionTimeoutMillis: 3000
    });
    try {
      await client.connect();
      console.log('SUCCESS with region:', region);
      await client.end();
      return region;
    } catch (e) {
      console.log('Failed:', e.message);
    }
  }
}
test();
