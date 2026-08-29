import { test, expect } from '@playwright/test';

test('login flow and redirect to overview', async ({ page }) => {
  await page.goto('/login');
  
  // Fill credentials
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Expect redirect to overview
  await expect(page).toHaveURL(/\/overview/);
});

test('middleware protects routes', async ({ page }) => {
  await page.goto('/overview');
  
  // Should redirect to login because we are not authenticated
  await expect(page).toHaveURL(/\/login/);
});
