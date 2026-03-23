import { test, expect } from '@playwright/test';

test('Verify HOD and Director Dashboards', async ({ page }) => {
  test.setTimeout(120000);

  const mockUser = {
    _id: 'user123',
    id: 'user123',
    name: 'Test HOD',
    email: 'hod@test.edu',
    tag: 'HOD/Dean',
    department: 'Computer Science',
    collegeId: 'college123',
    isApproved: true,
    token: 'fake-token'
  };

  const mockCollege = {
    _id: 'college123',
    id: 'college123',
    name: 'Test University',
    departments: ['Computer Science', 'Electrical'],
    classes: { 'Computer Science': ['CS-A', 'CS-B'] }
  };

  // Mock API calls
  await page.route('**/api/health', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ database: 'connected' }) });
  });

  await page.route('**/api/auth/me', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUser) });
  });

  await page.route('**/api/colleges', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockCollege]) });
  });

  await page.route('**/api/auth/users', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockUser]) });
  });

  await page.route('**/api/courses*', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/api/notices*', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/api/department-chats*', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/api/posts*', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/api/groups', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/api/conversations', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  // Set localStorage BEFORE navigation
  await page.addInitScript((user) => {
    window.localStorage.setItem('user', JSON.stringify(user));
  }, mockUser);

  // Go to HOD page - using port 5173
  await page.goto('http://localhost:5173/#/hod');

  // Take screenshot for debug
  await page.screenshot({ path: '/home/jules/verification/debug_hod.png' });

  // Verify HOD elements
  await expect(page.locator('text="HOD COMMAND CENTER"')).toBeVisible({ timeout: 20000 });
});
