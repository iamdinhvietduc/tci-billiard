import { getDb } from '../src/lib/db';

async function seed() {
  const db = await getDb();

  try {
    // Xóa dữ liệu cũ
    await db.exec('DELETE FROM bill_participants');
    await db.exec('DELETE FROM bills');
    await db.exec('DELETE FROM members');

    console.log('All data has been deleted successfully!');
  } catch (error) {
    console.error('Error deleting data:', error);
  } finally {
    await db.close();
  }
}

seed(); 