import { dag, Container, Directory, object, func } from "@dagger.io/dagger"

@object()
export class PuppeteerModule {
  /**
   * Capture a screenshot of a webpage
   */
  @func()
  async captureScreenshot(
    url: string,
    width: number = 1280,
    height: number = 720,
    fullPage: boolean = false
  ): Promise<Directory> {
    const script = `
      const puppeteer = require('puppeteer');
      
      (async () => {
        try {
          const browser = await puppeteer.launch({
            headless: "new",
            executablePath: '/usr/bin/chromium',
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu'
            ]
          });
          
          const page = await browser.newPage();
          await page.setDefaultNavigationTimeout(30000);
          await page.setViewport({ width: ${width}, height: ${height} });
          
          await page.goto('${url}', { waitUntil: 'networkidle0' });
          
          await page.screenshot({ 
            path: '/app/output/screenshot.png',
            fullPage: ${fullPage}
          });
          
          await browser.close();
        } catch (error) {
          console.error('Error:', error.message);
          process.exit(1);
        }
      })();
    `;

    return this.puppeteerContainer()
      .withWorkdir("/app")
      .withExec(["mkdir", "-p", "output"])
      .withExec(["node", "-e", script])
      .directory("/app/output");
  }

  /**
   * Click an element and capture a screenshot
   */
  @func()
  async clickAndCapture(
    url: string,
    selector: string,
    waitTime: number = 1000
  ): Promise<Directory> {
    const script = `
      const puppeteer = require('puppeteer');
      
      (async () => {
        try {
          const browser = await puppeteer.launch({
            headless: "new",
            executablePath: '/usr/bin/chromium',
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu'
            ]
          });
          
          const page = await browser.newPage();
          await page.setDefaultNavigationTimeout(30000);
          
          await page.goto('${url}', { waitUntil: 'networkidle0' });
          
          // Wait for element and click
          await page.waitForSelector('${selector}');
          await page.click('${selector}');
          
          // Wait for any animations or loading
          await page.waitForTimeout(${waitTime});
          
          // Take screenshot after click
          await page.screenshot({ 
            path: '/app/output/after-click.png'
          });
          
          await browser.close();
        } catch (error) {
          console.error('Error:', error.message);
          process.exit(1);
        }
      })();
    `;

    return this.puppeteerContainer()
      .withWorkdir("/app")
      .withExec(["mkdir", "-p", "output"])
      .withExec(["node", "-e", script])
      .directory("/app/output");
  }

  /**
   * Scroll and capture multiple screenshots
   */
  @func()
  async scrollAndCapture(
    url: string,
    scrollSteps: number = 3,
    stepSize: number = 800
  ): Promise<Directory> {
    const script = `
      const puppeteer = require('puppeteer');
      
      (async () => {
        try {
          const browser = await puppeteer.launch({
            headless: "new",
            executablePath: '/usr/bin/chromium',
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu'
            ]
          });
          
          const page = await browser.newPage();
          await page.setDefaultNavigationTimeout(30000);
          
          await page.goto('${url}', { waitUntil: 'networkidle0' });
          
          // Take initial screenshot
          await page.screenshot({ 
            path: '/app/output/scroll-0.png'
          });
          
          // Scroll and capture
          for (let i = 1; i <= ${scrollSteps}; i++) {
            await page.evaluate((step) => {
              window.scrollBy(0, step);
            }, ${stepSize});
            
            // Wait for any lazy-loaded content
            await page.waitForTimeout(1000);
            
            await page.screenshot({ 
              path: \`/app/output/scroll-\${i}.png\`
            });
          }
          
          await browser.close();
        } catch (error) {
          console.error('Error:', error.message);
          process.exit(1);
        }
      })();
    `;

    return this.puppeteerContainer()
      .withWorkdir("/app")
      .withExec(["mkdir", "-p", "output"])
      .withExec(["node", "-e", script])
      .directory("/app/output");
  }

  /**
   * Interact with a form - fill in fields and submit
   */
  @func()
  async fillForm(
    url: string,
    formData: string,  // JSON string of selector-value pairs
    submitSelector: string
  ): Promise<Directory> {
    const script = `
      const puppeteer = require('puppeteer');
      
      (async () => {
        try {
          const browser = await puppeteer.launch({
            headless: "new",
            executablePath: '/usr/bin/chromium',
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu'
            ]
          });
          
          const page = await browser.newPage();
          await page.setDefaultNavigationTimeout(30000);
          
          await page.goto('${url}', { waitUntil: 'networkidle0' });
          
          // Fill in form fields
          const data = JSON.parse('${formData}');
          for (const [selector, value] of Object.entries(data)) {
            await page.waitForSelector(selector);
            await page.type(selector, value);
          }
          
          // Take screenshot before submit
          await page.screenshot({ 
            path: '/app/output/before-submit.png'
          });
          
          // Submit form
          await page.click('${submitSelector}');
          await page.waitForTimeout(2000);
          
          // Take screenshot after submit
          await page.screenshot({ 
            path: '/app/output/after-submit.png'
          });
          
          await browser.close();
        } catch (error) {
          console.error('Error:', error.message);
          process.exit(1);
        }
      })();
    `;

    return this.puppeteerContainer()
      .withWorkdir("/app")
      .withExec(["mkdir", "-p", "output"])
      .withExec(["node", "-e", script])
      .directory("/app/output");
  }

  /**
   * Get the page title of a webpage
   */
  @func()
  async captureTitle(url: string): Promise<string> {
    const script = `
      const puppeteer = require('puppeteer');
      
      (async () => {
        try {
          const browser = await puppeteer.launch({
            headless: "new",
            executablePath: '/usr/bin/chromium',
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu'
            ]
          });
          
          const page = await browser.newPage();
          await page.setDefaultNavigationTimeout(30000);
          
          await page.goto('${url}', { waitUntil: 'networkidle0' });
          const title = await page.title();
          console.log(title);
          
          await browser.close();
        } catch (error) {
          console.error('Error:', error.message);
          process.exit(1);
        }
      })();
    `;

    return this.puppeteerContainer()
      .withExec(["node", "-e", script])
      .stdout();
  }

  /**
   * Create a container with Puppeteer and its dependencies
   */
  @func()
  puppeteerContainer(): Container {
    return dag
      .container()
      .from("node:20-slim")
      .withExec([
        "apt-get", "update"
      ])
      .withExec([
        "apt-get", "install", "-y",
        "chromium",
        "wget",
        "gnupg",
        "ca-certificates",
        "fonts-liberation",
        "libasound2",
        "libatk-bridge2.0-0",
        "libatk1.0-0",
        "libatspi2.0-0",
        "libcups2",
        "libdbus-1-3",
        "libdrm2",
        "libgbm1",
        "libgtk-3-0",
        "libnspr4",
        "libnss3",
        "libxcomposite1",
        "libxdamage1",
        "libxfixes3",
        "libxrandr2",
        "xdg-utils"
      ])
      .withEnvVariable("PUPPETEER_SKIP_CHROMIUM_DOWNLOAD", "true")
      .withEnvVariable("PUPPETEER_EXECUTABLE_PATH", "/usr/bin/chromium")
      .withWorkdir("/app")
      .withExec(["npm", "init", "-y"])
      .withExec(["npm", "install", "puppeteer", "--save"]);
  }
}
