// The mock applies the same rules as the backend; these tests mirror TC cases in the Testing workbook.
import { beforeEach, describe, expect, it } from 'vitest';
import { mockApi as api } from '../src/api/mock';

const as = (email: string) => api.signIn(email, 'sample');

describe('permissions and rules', () => {
  beforeEach(async () => {
    await api.signOut();
  });

  it('rejects non-company accounts (FR-001)', async () => {
    await expect(as('someone@gmail.com')).rejects.toMatchObject({ status: 403 });
  });

  it('rejects deactivated users (FR-015)', async () => {
    await expect(as('kim.bautista@awsys-i.com')).rejects.toMatchObject({ status: 403 });
  });

  it('employee cannot log time on a project they are not on (FR-007)', async () => {
    await as('aisha.rahman@awsys-i.com');
    // item 11 = Delta / Build / API; Aisha is not a Delta member
    await expect(api.addEntry({ itemId: 11, date: '2026-10-20', start: '09:00', end: '10:00', remarks: '' })).rejects.toMatchObject({ status: 403 });
  });

  it('employee cannot see a Private project they are not on (FR-029)', async () => {
    await as('aisha.rahman@awsys-i.com');
    const names = (await api.projects()).map((p) => p.name);
    expect(names).not.toContain('Gamma');
  });

  it('locked days refuse changes (FR-025)', async () => {
    await as('aisha.rahman@awsys-i.com');
    await expect(api.addEntry({ itemId: 1, date: '2026-09-25', start: '09:00', end: '10:00', remarks: '' })).rejects.toMatchObject({ status: 423 });
  });

  it('only Manager and Admin can lock dates (FR-025)', async () => {
    await as('aisha.rahman@awsys-i.com');
    await expect(api.addLock({ startDate: '2026-10-01', endDate: '2026-10-02', reason: 'test' })).rejects.toMatchObject({ status: 403 });
  });

  it('an unlock request needs a reason (FR-026)', async () => {
    await as('aisha.rahman@awsys-i.com');
    await expect(api.requestUnlock({ date: '2026-09-25', action: 'add', reason: ' ', details: '' })).rejects.toMatchObject({ status: 422 });
  });

  it('team lead cannot assign people outside the team (FR-031)', async () => {
    await as('dana.lopez@awsys-i.com');
    await expect(api.assign({ userId: 13, projectId: 1, roleOnProject: 'Developer', startDate: '2026-10-01', endDate: '2026-10-31' })).rejects.toMatchObject({ status: 403 });
  });

  it('audit log is admin-only (NFR-005)', async () => {
    await as('eli.park@awsys-i.com');
    await expect(api.audit()).rejects.toMatchObject({ status: 403 });
    await as('fay.ong@awsys-i.com');
    expect((await api.audit()).length).toBeGreaterThan(0);
  });
});
