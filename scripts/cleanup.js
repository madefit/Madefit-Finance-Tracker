const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2];
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .eq('destination', 'abhinchelakkal@gmail.com');
    
  if (error) console.error('Error deleting:', error);
  else console.log('Successfully deleted abhinchelakkal@gmail.com from notifications');
}

cleanup();
