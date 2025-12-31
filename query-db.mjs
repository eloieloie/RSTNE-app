import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: 'n1nlmysql41plsk.secureserver.net',
  port: 3306,
  user: 'eloiadmin1',
  password: 'Honor@new2025',
  database: 'ph10653097099_rstnedb'
});

try {
  // Create books_tbl
  console.log('Creating books_tbl...');
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS books_tbl (
      book_id INT AUTO_INCREMENT PRIMARY KEY,
      book_name VARCHAR(255) NOT NULL,
      book_description TEXT,
      dt_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ books_tbl created');

  // Create chapters_tbl
  console.log('Creating chapters_tbl...');
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS chapters_tbl (
      chapter_id INT AUTO_INCREMENT PRIMARY KEY,
      book_id INT,
      chapter_name VARCHAR(255) NOT NULL,
      chapter_description TEXT,
      chapter_notes TEXT,
      dt_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      dt_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books_tbl(book_id) ON DELETE CASCADE
    )
  `);
  console.log('✓ chapters_tbl created');

  // Show all tables
  const [tables] = await conn.execute('SHOW TABLES');
  console.log(`\n✓ Database now has ${tables.length} table(s):`);
  tables.forEach((t, i) => {
    const tableName = Object.values(t)[0];
    console.log(`  ${i + 1}. ${tableName}`);
  });

} catch (error) {
  console.error('Error:', error.message);
} finally {
  await conn.end();
}
