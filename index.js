const puppeteer = require("puppeteer");
const { executablePath } = require("puppeteer");
const stealth = require("puppeteer-extra-plugin-stealth");
const pptrXtra = require("puppeteer-extra");

pptrXtra.use(stealth);

// #twotabsearchtextbox
// #nav-search-submit-button

let getreviews = async (term, searchField, searchBtn, comment, lastPage) => {
  if (term) {
    let browser = await pptrXtra.launch({
      headless: false,
      executablePath: executablePath(),
    });

    let page = await browser.newPage();

    await page.setDefaultTimeout(120000);

    await page.goto(`https://amazon.com`, {
      waitUntil: "domcontentloaded",
    });

    // search for term.
    let search = await page.waitForSelector(searchField);
    if (search !== undefined) {
      await page.type(searchField, term, { delay: 10 });
      await page.click(searchBtn);
    } else {
      throw new Error("cant search");
    }
    await page.waitForNavigation();

    const item = await page.waitForSelector(`div[data-asin=${term}]`);
    // product page
    if (item !== undefined) {
      let link = await item.$("a");
      link.click();
    } else {
      throw new Error("cant find asin product");
    }
    await page.waitForNavigation();

    // reviews link
    let moreReviews = await page.waitForSelector(
      "a[data-hook=see-all-reviews-link-foot]"
    );

    if (moreReviews !== undefined) {
      moreReviews.click();
    } else {
      throw new Error("no link to reviews");
    }
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // get reviews
    let start = Date.now();
    let scrape = true;
    let pages = 0;
    while (scrape && pages < lastPage) {
      if (scrape === true) {
        await page.waitForNavigation();
        setTimeout(() => {
          (async () => {
            let revBody = await page.waitForSelector(
              "span[data-hook=review-body]"
            );
            if (revBody !== undefined) {
              let feedback = await page.$$eval(
                "span[data-hook=review-body]",
                (el) => {
                  return el.map((e) => {
                    return e.innerText;
                  });
                }
              );
              console.log(feedback);
              comment.push(feedback);
              if (feedback !== undefined && feedback.length > 0) {
                pages = pages + 1;
                setTimeout(async () => {
                  let nextBtn = await page.waitForSelector(
                    "ul[class=a-pagination]"
                  );

                  if (nextBtn !== undefined) {
                    let next = await nextBtn.$("li[class=a-last]");
                    if (next !== null) {
                      let classList = await next?.getProperty("className");
                      let jsonList = await classList?.jsonValue();
                      jsonList = jsonList?.split(" ");
                      console.log(jsonList);
                      if (!jsonList?.includes("a-disabled")) {
                        next.click();
                      } else {
                        await browser.close();
                        console.log("last page");
                        scrape = false;
                        return comment;
                      }
                    } else {
                      await browser.close();
                      console.log("last page");
                      scrape = false;
                      return comment;
                    }
                  } else {
                    await browser.close();
                    throw new Error("couldnt find page button");
                  }
                }, 500);
              } else {
                await browser.close();
                throw new Error("page has no feedback");
              }
            } else {
              await browser.close();
              throw new Error("no reviews");
            }
          })();
          return;
        }, 1500);
      }
    }

    await browser.close();

    let end = Date.now();
    console.log("///////////////////////////////////////////////////");
    console.log(end - start, ": ms");
    console.log("done");
    return comment;
  }
  return;
};

(async (term) => {
  let comment = [];
  try {
    let results = await getreviews(
      term,
      "#twotabsearchtextbox",
      "#nav-search-submit-button",
      comment,
      10
    );
    console.log(results);
  } catch (error) {
    if (error.message === "cant search") {
      try {
        let results = await getreviews(
          term,
          "#nav-bb-search",
          ".nav-bb-submit",
          comment,
          10
        );
        console.log(results);
      } catch (error) {
        console.log(error.message);
        console.log(comment);
        return { error: true, message: error.message };
      }
    } else {
      console.log(error.message);
      console.log(comment);
      return { error: true, message: error.message, comment: comment };
    }
  }
})("B08H5L51ZG");
// let search2 = await page.waitForSelector("#nav-bb-search");
//         console.log(search);
//         if (search2 !== undefined) {
//           await page.type("#nav-bb-search", term, { delay: 10 });
//           await page.click(".nav-bb-submit");
//         } else {
//           throw new Error("cant search for asin");
//         }
