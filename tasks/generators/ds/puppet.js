const puppeteer = require('puppeteer');

function Puppet() {

}

var prot = Puppet.prototype;


prot.test = async function(url) {

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url, {waitUntil: 'networkidle2'});

  await browser.close();
  return;

}

prot.runSearchWithPagination = async function (url, options = {}) {
  const { specialty, city, postalCode } = options;

  browser = await puppeteer.launch({headless: false});
  page = await browser.newPage();

  // Navigate to the CPSO Advanced Search page
  await page.goto(url, {waitUntil: 'networkidle2'});

  if (specialty) {
    // Select the radio button with id="doctorTypeSpecialist"
    try {
      const radioButtonSelector = '#doctorTypeSpecialist';
      await page.waitForSelector(radioButtonSelector, {timeout: 5000});
      await page.click(radioButtonSelector);
      console.log('Selected radio button for Specialist');
    } catch (err) {
      console.error('Error selecting the radio button:', err.message);
    }

    // Select dropdown with id="specialistType"
    try {
      const specialistTypeSelector = '#specialistType';
      await page.waitForSelector(specialistTypeSelector, {timeout: 5000});
      await page.select(specialistTypeSelector, specialty);
      console.log(`Selected ${specialty} in the specialist type dropdown`);
    } catch (err) {
      console.error('Error selecting from dropdown:', err.message);
    }
  }


  if (city) {
    // Select "Toronto" in the dropdown with id="hospitalLocation"
    try {
      const dropdownSelector = '#hospitalLocation';
      await page.waitForSelector(dropdownSelector, {timeout: 5000});
      await page.select(dropdownSelector, city);
      console.log(`Selected ${city} in the dropdown`);
    } catch (err) {
      console.error('Error selecting from dropdown:', err.message);
    }
  } else if (postalCode) {
    try {
      const postalCodeSelector = '#postalCode';
      await page.waitForSelector(postalCodeSelector, { timeout: 5000 });
      await page.type(postalCodeSelector, postalCode.trim(), { delay: 100 });
      console.log(`Entered postal code: "${postalCode}".`);
    } catch (err) {
      console.error(`Error entering postal code "${postalCode}":`, err.message);
    }
  }

  // Click the submit button with class "search-button" under "search-buttons"
  try {
    const specificSubmitButtonSelector = '.search-buttons .search-button';
    await page.waitForSelector(specificSubmitButtonSelector, {timeout: 5000});
    await page.click(specificSubmitButtonSelector);
    console.log('Clicked the submit button');
  } catch (err) {
    console.error('Error clicking the submit button:', err.message);
  }

  // Wait for the response and capture the HTML
  try {
    await page.waitForNavigation({waitUntil: 'networkidle2', timeout: 10000});
    responseHTML = await page.content(); // Capture the full page HTML
    console.log('HTML response captured successfully');
  } catch (err) {
    console.error('Error capturing the response HTML:', err.message);
  }

  // responseHtmlAr.push(responseHTML);

  let pages = await this.collectAllPages(page);

  await browser.close();
  return pages;
}


prot.collectAllPages = async function(page) {
  const pagesData = [];

  let currentPageNumber = 1;

  while (true) {
    console.log(`Scraping page ${currentPageNumber}...`);

    // Scroll to the bottom of the page to ensure all content is visible
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Collect data from the current page
    const pageData = await page.evaluate(() => {
      // Replace this with your specific data extraction logic
      return document.body.innerHTML;
    });

    // Check if we have already collected this page's data
    if (pagesData.includes(pageData)) {
      console.log('Duplicate page data detected, stopping.');
      break;
    }

    pagesData.push(pageData);

    // Find the "Next" link
    const nextLink = await page.$('#pagination-controls a[data-page]');
    if (!nextLink) {
      console.log('No "Next" link found. Pagination completed.');
      break;
    }

    console.log('Found "Next" link, attempting to click...');

    // Get the expected value of the "selected" option for the next page
    const expectedValue = String(currentPageNumber); // Page numbers are zero-indexed in the "value" attribute

    // Scroll to the "Next" link and click it
    await nextLink.evaluate(el => el.scrollIntoView());
    await nextLink.evaluate(el => el.click());

    // Wait for the dropdown to update to the expected page value
    await page.waitForFunction(
      (expectedValue) => {
        const selectedOption = document.querySelector('#pagination-controls #page-select option[selected]');
        return selectedOption && selectedOption.value === expectedValue;
      },
      { timeout: 30000 },
      expectedValue
    );

    console.log(`Navigated to page ${currentPageNumber + 1}.`);
    currentPageNumber++;
  }

  return pagesData;
}

exports = module.exports = new Puppet();
