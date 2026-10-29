import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import type { FullConfig } from '@playwright/test';

// Browser API mocks cannot authenticate Next's server-side route guard. Give
// UI tests short-lived cookies for their own disposable local database users.
// No mock credential or bypass is accepted by application code.
export default async function setup(config: FullConfig) {
  const base = new URL(String(config.projects[0].use.baseURL || 'http://localhost:3000'));
  if (!['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)) throw new Error('UI fixture setup requires a local application.');
  const root = path.resolve(__dirname, '../../back');
  const requireBack = createRequire(path.join(root, 'package.json'));
  const env = requireBack('dotenv').parse(fs.readFileSync(path.join(root, '.env')));
  if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(env.DATABASE_URL || '').hostname)) throw new Error('UI fixture setup refuses a non-local database.');
  const { PrismaClient } = requireBack('@prisma/client'), jwt = requireBack('jsonwebtoken');
  const db = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
  const ids: string[] = [], nonce = crypto.randomUUID();
  try {
    for (const role of ['STUDENT', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'INACTIVE_STUDENT']) {
      const user = await db.user.create({ data: { name: 'Disposable UI session fixture', username: `ui-session-${nonce}-${role}`, password: crypto.randomBytes(48).toString('hex'),
        role: role === 'INACTIVE_STUDENT' ? 'STUDENT' : role, status: role === 'INACTIVE_STUDENT' ? 'INACTIVE' : 'ACTIVE' } });
      ids.push(user.id);
      process.env[`UI_TEST_SESSION_${role}`] = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '1h' });
      if (role === 'STUDENT') {
        process.env.UI_TEST_EXPIRED_SESSION = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: -1 });
        process.env.UI_TEST_REFRESH_SESSION = jwt.sign({ id: user.id, role: user.role, purpose: 'session_refresh' }, env.JWT_SECRET, { expiresIn: '1h' });
      }
    }
    await db.$disconnect();
  } catch (error) { await db.user.deleteMany({ where: { id: { in: ids } } }); await db.$disconnect(); throw error; }
  return async () => { try { await db.user.deleteMany({ where: { id: { in: ids } } }); } finally { await db.$disconnect(); } };
}
