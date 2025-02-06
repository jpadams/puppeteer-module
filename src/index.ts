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
      // Create output directory
      .withExec(["mkdir", "-p", "output"])
      // Run screenshot script
      .withExec(["node", "-e", script])
      // Return the output directory
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
      // Update package list and install required dependencies
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
      // Set environment variables for Puppeteer
      .withEnvVariable("PUPPETEER_SKIP_CHROMIUM_DOWNLOAD", "true")
      .withEnvVariable("PUPPETEER_EXECUTABLE_PATH", "/usr/bin/chromium")
      // Create and set up working directory
      .withWorkdir("/app")
      // Initialize npm project and install Puppeteer
      .withExec(["npm", "init", "-y"])
      .withExec(["npm", "install", "puppeteer", "--save"]);
  }
}
