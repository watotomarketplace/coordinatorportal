import { dbRun, initDatabase } from './db/init.js';
import bcrypt from 'bcryptjs';

async function fixPasswords() {
    try {
        await initDatabase();

        const passwordHash = bcrypt.hashSync('admin123', 10);

        console.log('Generated hash:', passwordHash);

        // Update all accounts to be active and have 'admin123' as password
        await dbRun('UPDATE users SET active = 1, password = ?', [passwordHash]);

        console.log('✅ Successfully reset all user passwords to admin123 and set them active.');
    } catch (err) {
        console.error('Failed:', err);
    }
}

fixPasswords();
