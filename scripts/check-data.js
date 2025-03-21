const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function checkData() {
  try {
    const db = await open({
      filename: path.join(process.cwd(), 'data', 'billiards.db'),
      driver: sqlite3.Database
    });

    console.log('Checking Members:');
    const members = await db.all('SELECT * FROM members');
    console.log(members);

    console.log('\nChecking Bills:');
    const bills = await db.all('SELECT * FROM bills');
    console.log(bills);

    console.log('\nChecking Bill Participants:');
    const participants = await db.all('SELECT * FROM bill_participants');
    console.log(participants);

    console.log('\nChecking Bill Items:');
    const items = await db.all('SELECT * FROM bill_items');
    console.log(items);

    console.log('\nChecking Payments:');
    const payments = await db.all('SELECT * FROM payments');
    console.log(payments);

    await db.close();
  } catch (error) {
    console.error('Error checking data:', error);
  }
}

checkData(); 