
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env parsing
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) env[key.trim()] = val.trim();
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
    console.log('Checking connection...');
    const { data, error } = await supabase.from('games').select('count', { count: 'exact', head: true });

    if (error) {
        if (error.code === '42P01') { // undefined_table
            console.log('❌ Table "games" does not exist.');
            console.log('Please run the SQL schema in your Supabase Dashboard SQL Editor.');
        } else {
            console.error('❌ Error connecting:', error.message, error.code);
        }
    } else {
        console.log('✅ Connected! "games" table exists.');
    }
}

check();
