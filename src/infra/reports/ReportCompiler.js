const puppeteer = require('puppeteer');
const hbs = require('handlebars');
const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');
const { PDFDocument } = require('pdf-lib');
const { PUBLIC_URL } = process.env;

module.exports = class ReportCompiler {
  constructor() {
    this.reports = {
      DOCUMENT_MASTER_LIST: 'documents/masterList.hbs',
      TRAINING_AUDIENCE_LIST: 'trainings/audienceList.hbs'
    }
  }

  async generate(template, data, user) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const input = {
      username: user.name,
      company: user.company.name,
      logo: path.join(PUBLIC_URL, `${user.company.cid}.jpg`),
      reportCSS: path.join(PUBLIC_URL, 'report.css'),
      emissionDate: moment().format('DD/MM/YYYY HH:mm'),
      data
    }

    const content = await this._compile(template, input);
    await page.setContent(content);
    await page.emulateMediaType('screen');

    const pdfBytes = await page.pdf({
      format: "A4",
      margin: {
        left: 20,
        right: 20
      },
      printBackground: true
    });

    await browser.close();
    const newPdf = await this.insertPageNumber(pdfBytes);
    return Buffer.from(newPdf);
  }

  async _compile(template, data) {
    const filePath = path.join(process.cwd(), 'infra/reports', template);
    const html = await fs.readFile(filePath, 'utf-8');
    return hbs.compile(html)(data);
  }

  async insertPageNumber(pdfDocument) {
    const pdfDoc = await PDFDocument.load(pdfDocument);
    const pages = pdfDoc.getPages();
    
    pages.forEach((page, index) => {
        const text = `Página ${index + 1} de ${pages.length}`
        page.drawText(text, {
            x: 480,
            y: 30,
            size: 12
        });
    });

    return await pdfDoc.save();
  }
}