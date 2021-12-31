import { test as base } from '@playwright/test';

export const test = base.extend({
	// @ts-expect-error
	is_in_viewport: async ({ page, javaScriptEnabled }, use) => {
		/** @param {string} selector */
		async function is_in_viewport(selector) {
			// @ts-expect-error
			return page.$eval(selector, async (element) => {
				const visibleRatio = await new Promise((resolve) => {
					const observer = new IntersectionObserver((entries) => {
						resolve(entries[0].intersectionRatio);
						observer.disconnect();
					});
					observer.observe(element);
					// Firefox doesn't call IntersectionObserver callback unless there are rafs
					requestAnimationFrame(() => {});
				});
				return visibleRatio > 0;
			});
		}

		use(is_in_viewport);
	},

	// @ts-expect-error
	clicknav: async ({ page, javaScriptEnabled }, use) => {
		/** @param {string} selector */
		async function clicknav(selector) {
			if (javaScriptEnabled) {
				await page.evaluate(() => {
					window.navigated = new Promise((fulfil, reject) => {
						const timeout = setTimeout(() => reject(new Error('Timed out')), 2000);
						addEventListener(
							'sveltekit:navigation-end',
							() => {
								clearTimeout(timeout);
								fulfil();
							},
							{ once: true }
						);
					});
				});

				await Promise.all([
					page.waitForNavigation({ waitUntil: 'networkidle' }),
					page.click(selector),
					page.evaluate(() => window.navigated)
				]);
			} else {
				await page.click(selector);
			}
		}

		use(clicknav);
	}
});

/** @type {import('@playwright/test').PlaywrightTestConfig} */
export const config = {
	timeout: 2000,
	webServer: {
		command: process.env.DEV ? 'npm run dev' : 'npm run build && npm run preview',
		port: 3000,
		timeout: 10000
	},
	projects: [
		{
			name: '+js',
			use: {
				javaScriptEnabled: true
			}
		},
		{
			name: '-js',
			use: {
				javaScriptEnabled: false
			}
		}
	]
};
