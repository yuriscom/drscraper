const cheerio = require('cheerio');
const axios = require('axios');
const json2xls = require("json2xls");
const fs = require("fs");

const doctorParser = require(__dirname + '/doctor-parser');
const puppet = require(__dirname + '/puppet');

const baseUrl = 'https://register.cpso.on.ca';

function ApiProcessor(options, callback) {
  this.params = options;
}

var prot = ApiProcessor.prototype;

prot.mockDoctorRequest = async function () {
  let doctors = [];
  let hrefs = ["https://register.cpso.on.ca/physician-info/?cpsonum=97982"];
  let doctorInfoPages = await this.collectDoctorInfoPagesContent(hrefs);
  for (let k in doctorInfoPages) {
    let record = doctorInfoPages[k];
    doctors.push(doctorParser.parseDoctorDetails(record.html, record.url));
  }
}

prot.run = async function () {
  let self = this;
  let doctors = [];

  let htmlAr = await self.search();
  console.log(`Search complete. Collected ${htmlAr.length} pages`);

  for (let k in htmlAr) {
    let html = htmlAr[k];
    console.log(`Scraping page ${parseInt(k) + 1} / ${htmlAr.length}`);
    let doctorsChunk = await self.parseDoctorsFromResultPage(html);
    doctors = doctors.concat(doctorsChunk);
    console.log(`Completed scraping page ${parseInt(k) + 1} / ${htmlAr.length}`);
  }
  console.log(`Finished scraping pages. Collected ${doctors.length} doctors`);

  const validationResult = self.validateResults(doctors, htmlAr);
  if (!validationResult.hasResults) {
    throw new Error(validationResult.error);
  } else {
    // processing results into the file
    var filepath = __dirname + '/../data/' + self.getFilename();
    console.log(`Dumping into file ${filepath}`);

    var xls = json2xls(doctors);
    fs.writeFileSync(filepath, xls, 'binary');

    console.log("Excel file is generated successfully.");
    return filepath;
  }
}

prot.validateResults = function (doctors, htmlAr) {
  if (doctors.length === 0) {
    if (htmlAr.length > 0) {
      try {
        const noResultsSelector = '#noResultsMessageMobile';
        const tooManyResultsSelector = '#maximumResultsCountMessageMobile';

        let searchResultPage = htmlAr[0];
        const $ = cheerio.load(searchResultPage);

        // Check if "no results found" message is displayed
        if ($(noResultsSelector).css('display') === 'block') {
          console.log('No results found on the page.');
          return {hasResults: false, error: 'No results found.'};
        }

        // Check if "too many results to display" message is displayed
        if ($(tooManyResultsSelector).css('display') === 'block') {
          console.log('Too many results to display.');
          return {hasResults: false, error: 'Too many results to display.'};
        }
      } catch (err) {
        console.error('Error validating page results:', err.message);
        return { hasResults: false, error: 'Unknown validation error' };
      }
    } else {
      console.error('Unknown search error:', err.message);
      return { hasResults: false, error: 'Unknown search error' };
    }
  } else {
    return {hasResults: true, error: null };
  }
}

prot.parseDoctorsFromResultPage = async function (html) {
  let self = this;
  let doctors = [];
  let doctorInfoPages = await self.parseResultPageWithDoctorsList(html);
  console.log(`Successfully fetched ${doctorInfoPages.length} doctor info pages`);

  for (let k in doctorInfoPages) {
    let record = doctorInfoPages[k];
    console.log(`Parsing doctor ${parseInt(k) + 1} / ${doctorInfoPages.length}`);
    doctors.push(doctorParser.parseDoctorDetails(record.html, record.url));
  }
  console.log(`Parsing of ${doctors.length} doctors complete`);
  return doctors;
}

prot.search = async function () {
  let self = this;
  const url = baseUrl + '/Advanced-Search/';
  let responses = await puppet.runSearchWithPagination(url, {
    doctorType: self.params['doctorType'],
    specialty: self.params['spec'],
    city: self.params['city'],
    postalCode: self.params['postal']
  });

  return responses;
}

/**
 *
 * @param html
 * @returns list of html pages - each html page is a doctor info
 */
prot.parseResultPageWithDoctorsList = async function (html) {
  let self = this;
  const $ = cheerio.load(html);

// Extract all "href" attributes for rows
  const hrefs = [];
  $('.mobile-view .search-results #physician-results-mobile > a').each((_, element) => {
    const dataHref = $(element).attr('href');
    if (dataHref) {
      hrefs.push(`${baseUrl}${dataHref}`);
    }
  });

  console.log(`Found ${hrefs.length} doctor detail links.`);

  const doctorInfoPages = await self.collectDoctorInfoPagesContent(hrefs);

  // Filter out null results (failed requests)
  const validDoctorInfoPages = doctorInfoPages.filter(detail => detail !== null);

  return validDoctorInfoPages;

}

// Fetch all URLs in parallel, return array of htmls
prot.collectDoctorInfoPagesContent = async function (hrefs) {
  return await Promise.all(
    hrefs.map(async (url) => {
      try {
        const response = await axios.get(url);
        return {url, html: response.data}; // You can process the HTML further here
      } catch (error) {
        console.error(`Failed to fetch ${url}:`, error.message);
        return null; // Return null if a request fails
      }
    })
  );
}

prot.getFilename = function () {
  let doctorType = (this.params.doctorType ? this.params.doctorType + '' : 'family');
  let spec = (this.params.spec ? this.params.spec + '' : '0');
  let isFamily = doctorType == 'family' && spec == '0'
  let city = (this.params.city ? this.params.city + '' : '0');
  let postal = (this.params.postal ? this.params.postal + '' : '0');
  return 'data_spec' + (isFamily ? 'family' : spec) + '_city' + city + '_postal' + postal + '.xlsx';
}

exports = module.exports = ApiProcessor;