import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: 'n1nlmysql41plsk.secureserver.net',
  port: 3306,
  user: 'eloiadmin1',
  password: 'Honor@new2025',
  database: 'ph10653097099_rstnedb'
});

try {
  console.log('Renaming chapter_name to chapter_number...');
  
  // Check if column exists
  const [columns] = await conn.execute(`
    SHOW COLUMNS FROM chapters_tbl LIKE 'chapter_name'
  `);
  
  if (columns.length > 0) {
    // Rename the column
    await conn.execute(`
      ALTER TABLE chapters_tbl 
      CHANGE COLUMN chapter_name chapter_number VARCHAR(255) NOT NULL
    `);
    console.log('✓ Column renamed from chapter_name to chapter_number');
  } else {
    console.log('✓ Column chapter_name does not exist (may already be renamed)');
  }
  
  // Show the updated table structure
  const [tableStructure] = await conn.execute('DESCRIBE chapters_tbl');
  console.log('\nUpdated chapters_tbl structure:');
  tableStructure.forEach(col => {
    console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Extra}`);
  });

} catch (error) {
  console.error('Error:', error.message);
} finally {
  await conn.end();
}
