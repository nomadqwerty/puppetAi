const puppeteer = require("puppeteer");

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: false,
      userDataDir: "./tmp",
    });

    const page = await browser.newPage();

    await page.goto("https://bard.google.com/");

    const document = await page.waitForSelector(".light-theme");
    const signIn = await document.$(".gb_ma.gb_td.gb_Xd.gb_id");
    signIn.click();
    const signInPage = await page.waitForSelector(".nyoS7c.UzCXuf.EIlDfe");
    const input = await signInPage.$(".whsOnd.zHQkBf");
    console.log("input");
    console.log(input);
    // await browser.close();
  } catch (error) {
    console.log(error);
  }
})();
