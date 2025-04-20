var cheerio = require('cheerio');

function DoctorParser() {

}

function cleanValue(value) {
  return value ? value.trim().replace(/\s+/g, ' ') : null;
}

var prot = DoctorParser.prototype;

prot.parseDoctorDetails = function (html, url) {
  console.log("Parsing URL: " + url)
  const doctor = {
    id: '',
    url: url,
    firstname: '',
    lastname: '',
    language: '',
    gender: '',
    phone: '',
    fax: '',
    address: '',
    address2: '',
    city: '',
    province: '',
    postal: '',
    'Registration Class': '',
    specialties: '',
    'Secondary Phone': '',
    'Secondary Fax': '',
    'Secondary Address': '',
    'Secondary Address2': '',
    'Secondary City': '',
    'Secondary Province': '',
    'Secondary Postal': '',
  }
  const $ = cheerio.load(html);

  // Extracting doctor.id from the URL
  const urlParams = new URL(url).searchParams;
  doctor.id = urlParams.get('cpsonum');

  // Extracting doctor.lastname and doctor.firstname
  const nameText = $('#content h1.doctor-name.scrp-contactname-value').text();
  if (nameText) {
    const nameParts = nameText.split(',');
    if (nameParts.length === 2) {
      doctor.lastname = cleanValue(nameParts[0]);
      doctor.firstname = cleanValue(nameParts[1]);
    } else {
      doctor.lastname = cleanValue(nameParts[0]);
      doctor.firstname = cleanValue(nameParts.slice(1).join(','));
    }
  }

  // Extracting doctor.language
  doctor.language = cleanValue($('.tab-content .desktop-view.scrp-generalinfo div.scrp-laguage span.scrp-laguage-value').text());

  // Extracting doctor.gender
  doctor.gender = cleanValue($('.tab-content .desktop-view.scrp-generalinfo div.scrp-gender span.scrp-gender-value').text());

  // Extracting doctor.phone
  doctor.phone = cleanValue($(".tab-content #practice-information .list-content:not(.scrp-additionalinfo) .scrp-phone .scrp-phone-value").text());

  // Extracting doctor.fax
  doctor.fax = cleanValue($('.tab-content #practice-information .list-content:not(.scrp-additionalinfo) div.scrp-fax span.scrp-fax-value').text());

  // Extracting doctor primary address details
  const addressText = $('.tab-content #practice-information .list-content:not(.scrp-additionalinfo) div.scrp-practiceaddress span.scrp-practiceaddress-value').html();
  let primaryAddress = this.parseDoctorAddress(addressText);
  doctor.address = primaryAddress.address;
  doctor.address2 = primaryAddress.address2;
  doctor.city = primaryAddress.city;
  doctor.province = primaryAddress.province;
  doctor.postal = primaryAddress.postal;

  // Extracting secondary phone
  doctor['Secondary Phone'] = $(".tab-content #practice-information .list-content.scrp-additionalinfo .scrp-phone .scrp-phone-value")
    .map(function () {
      return $(this).text().trim();
    })
    .get()
    .join(", ");

  // Extracting secondary fax
  doctor['Secondary Fax'] = $('.tab-content #practice-information .list-content.scrp-additionalinfo div.scrp-fax span.scrp-fax-value')
    .map(function () {
      return $(this).text().trim();
    })
    .get()
    .join(", ");

  // Extracting doctor secondary address details
  const addressTextSecondary = $('.tab-content #practice-information .list-content.scrp-additionalinfo div.scrp-practiceaddress span.scrp-practiceaddress-value').html();
  let secondaryAddress = this.parseDoctorAddress(addressTextSecondary);
  doctor['Secondary Address'] = secondaryAddress.address;
  doctor['Secondary Address2'] = secondaryAddress.address2;
  doctor['Secondary City'] = secondaryAddress.city;
  doctor['Secondary Province'] = secondaryAddress.province;
  doctor['Secondary Postal'] = secondaryAddress.postal;


  // Extracting doctor.registration class
  doctor['Registration Class'] = cleanValue($('#mainContent #content span.reg-class').text());

  // Extracting doctor.specialties
  doctor.specialties = $('#nav-tabContent #specialties')
    .first()
    .find('.desktop-view .scrp-specialtyname-value')
    .map(function () {
      return $(this).text().trim();
    })
    .get()
    .join(", ");

  // Secondary Address


  return doctor;
}

prot.parseDoctorAddress = function (addressHtml) {
  const doctor = {
    address: '',
    address2: '',
    city: '',
    province: '',
    postal: ''
  };

  if (!addressHtml) return doctor;

  const addressLines = addressHtml
    .split('<br>')
    .map(line => cleanValue(line))
    .filter(Boolean);

  if (addressLines.length === 0) return doctor;

  const lastLine = addressLines[addressLines.length - 1];

  // Flexible Canadian address regex: city [province]? postal
  const addressRegex = /^([\w\s'.-]+?)\s*(ON|Ontario)?\s+([A-Z]\d[A-Z]\s?\d[A-Z]\d)$/i;
  const match = addressRegex.exec(lastLine);

  if (match) {
    doctor.city = match[1].trim();
    doctor.province = match[2] ? (match[2] === 'Ontario' ? 'ON' : match[2]) : '';
    doctor.postal = match[3].toUpperCase();
    doctor.address = addressLines[0];
    doctor.address2 = addressLines.slice(1, addressLines.length - 1).join(', ');
  } else {
    // fallback: put entire block in 'address'
    doctor.address = addressLines.join(', ');
  }

  return doctor;
}

exports = module.exports = new DoctorParser();