import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDb } from '../database/db';

export async function exportAllData(): Promise<void> {
  const db = await getDb();
  const holdings = await db.getAllAsync('SELECT * FROM holdings');
  const expenses = await db.getAllAsync('SELECT * FROM expenses');
  const income = await db.getAllAsync('SELECT * FROM income');
  const settings = await db.getAllAsync('SELECT * FROM settings');

  const dump = { exportedAt: new Date().toISOString(), holdings, expenses, income, settings };
  const json = JSON.stringify(dump, null, 2);
  const file = new File(Paths.cache, 'rahnuma_backup.json');

  const writable = file.writableStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  await writer.write(encoder.encode(json));
  await writer.close();

  await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
}
