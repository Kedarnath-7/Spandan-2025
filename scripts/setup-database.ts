import { supabase } from '../lib/supabase';
import fs from 'fs';
import path from 'path';

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'database_setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (error) {
            console.error(`Error in statement ${i + 1}:`, error);
          }
        } catch (err) {
          console.error(`Error executing statement ${i + 1}:`, err);
        }
      }
    }
    
    console.log('Database setup completed!');
    
    // Test the setup by checking if tables exist
    const { data: tables, error: tableError } = await supabase
      .from('group_registrations')
      .select('count(*)')
      .limit(1);
      
    if (tableError) {
      console.error('Table check failed:', tableError);
    } else {
      console.log('Tables are accessible!');
    }
    
  } catch (error) {
    console.error('Database setup failed:', error);
  }
}

// Run the setup
setupDatabase();
