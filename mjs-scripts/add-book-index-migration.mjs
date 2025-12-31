import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: 'n1nlmysql41plsk.secureserver.net',
  port: 3306,
  user: 'eloiadmin1',
  password: 'Honor@new2025',
  database: 'ph10653097099_rstnedb'
});

try {
  console.log('Adding book_index column to books_tbl...');
  
  // Check if column already exists
  const [columns] = await conn.execute(`
    SHOW COLUMNS FROM books_tbl LIKE 'book_index'
  `);
  
  if (columns.length > 0) {
    console.log('✓ book_index column already exists');
  } else {
    // Add the column
    await conn.execute(`
      ALTER TABLE books_tbl 
      ADD COLUMN book_index INT NULL AFTER book_description
    `);
    console.log('✓ book_index column added successfully');
  }
  
  // Show the updated table structure
  const [tableStructure] = await conn.execute('DESCRIBE books_tbl');
  console.log('\nUpdated books_tbl structure:');
  tableStructure.forEach(col => {
    console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
  });

} catch (error) {
  console.error('Error:', error.message);
} finally {
  await conn.end();
}
