import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: 'n1nlmysql41plsk.secureserver.net',
  port: 3306,
  user: 'eloiadmin1',
  password: 'Honor@new2025',
  database: 'ph10653097099_rstnedb'
});

try {
  console.log('Modifying book_id to remove AUTO_INCREMENT...');
  
  // Step 1: Drop the foreign key constraint
  console.log('Step 1: Dropping foreign key constraint...');
  await conn.execute(`
    ALTER TABLE chapters_tbl 
    DROP FOREIGN KEY chapters_tbl_ibfk_1
  `);
  console.log('✓ Foreign key dropped');
  
  // Step 2: Modify the book_id column to remove AUTO_INCREMENT
  console.log('Step 2: Removing AUTO_INCREMENT from book_id...');
  await conn.execute(`
    ALTER TABLE books_tbl 
    MODIFY COLUMN book_id INT NOT NULL
  `);
  console.log('✓ AUTO_INCREMENT removed from book_id');
  
  // Step 3: Recreate the foreign key constraint
  console.log('Step 3: Recreating foreign key constraint...');
  await conn.execute(`
    ALTER TABLE chapters_tbl 
    ADD CONSTRAINT chapters_tbl_ibfk_1 
    FOREIGN KEY (book_id) REFERENCES books_tbl(book_id) ON DELETE CASCADE
  `);
  console.log('✓ Foreign key recreated');
  
  // Show the updated table structure
  const [tableStructure] = await conn.execute('DESCRIBE books_tbl');
  console.log('\nUpdated books_tbl structure:');
  tableStructure.forEach(col => {
    console.log(`  - ${col.Field}: ${col.Type} ${col.Key ? `(${col.Key})` : ''} ${col.Extra}`);
  });

} catch (error) {
  console.error('Error:', error.message);
} finally {
  await conn.end();
}
