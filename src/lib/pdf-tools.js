import PdfPrinter from "pdfmake";
import btoa from "btoa";
import fetch from "node-fetch";
import { extname } from "path";
import { pipeline } from "stream";
import { promisify } from "util"; // CORE MODULE
import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
// Define font files

const fetchIamgeBuffer = async (image) => {
  let result = await fetch(image, {
    responseType: "arraybuffer",
  });
  return result.arrayBuffer();
};

const convertImageBase64 = async (data) => {
  let imageBuffer = await fetchImage(data.cover);

  const base64String = Buffer.from(imageBuffer).toString("base64");

  const coverPath = data.cover.split("/");

  const fileName = coverPath[coverPath.length - 1];

  const extension = extname(fileName);

  const baseUrl = `data:image/${extension};base64,${base64String}`;

  return baseUrl;
};

export const getPDFReadableStream = async (data) => {
  const fonts = {
    Helvetica: {
      normal: "Helvetica",
      bold: "Helvetica-Bold",
      italics: "Helvetica-Oblique",
      bolditalics: "Helvetica-BoldOblique",
    },
  };

  const printer = new PdfPrinter(fonts);

  let imagePart = {};
  if (data.cover) {
    let imageBufferArray = await fetchIamgeBuffer(data.cover);
    console.log(imageBufferArray);

    const base64String = btoa(
      String.fromCharCode(...new Uint8Array(imageBufferArray))
    );
    console.log(base64String);

    const coverPath = data.cover.split("/");
    const fileName = coverPath[coverPath.length - 1];
    const extension = extname(fileName);
    const base64Pdf = `data:image/${extension};base64,${base64String}`;

    imagePart = { image: base64Pdf, width: 500, margin: [0, 0, 0, 40] };
  }

  const docDefinition = {
    content: [
      imagePart,
      { text: data.id, fontSize: 20, bold: true, margin: [0, 0, 0, 40] },
      { text: data.title, fontSize: 20, bold: true, margin: [0, 0, 0, 40] },
      { text: data.category, fontSize: 20, bold: true, margin: [0, 0, 0, 40] },
      { text: data.content, fontSize: 20, bold: true, margin: [0, 0, 0, 40] },
      { text: data.createdAt, fontSize: 20, bold: true, margin: [0, 0, 0, 40] },
    ],
    defaultStyle: {
      font: "Helvetica",
    },
  };

  const options = {
    // ...
  };

  const pdfReadableStream = printer.createPdfKitDocument(
    docDefinition,
    options
  );
  // pdfReadableStream.pipe(fs.createWriteStream('document.pdf')); // old syntax for piping
  // pipeline(pdfReadableStream, fs.createWriteStream('document.pdf')) // new syntax for piping (we don't want to pipe pdf into file on disk right now)
  pdfReadableStream.end();
  return pdfReadableStream;
};

export const generatePDFAsync = async (data) => {
  const asyncPipeline = promisify(pipeline); // promisify is a (VERY COOL) utility which transforms a function that uses callbacks (error-first callbacks) into a function that uses Promises (and so Async/Await). Pipeline is a function that works with callbacks to connect 2 or more streams together --> I can promisify a pipeline getting back and asynchronous pipeline

  const fonts = {
    Helvetica: {
      normal: "Helvetica",
      bold: "Helvetica-Bold",
      // italics: "fonts/Roboto-Italic.ttf",
      // bolditalics: "fonts/Roboto-MediumItalic.ttf",
    },
  };

  const printer = new PdfPrinter(fonts);

  if (data.cover) {
    const base64UrlPDF = await convertImageBase64(data);

    let docDefinition = {
      content: [
        {
          image: base64UrlPDF,
          width: "500",
        },
        {
          text: `${data.title}`,
          style: "header",
        },
        {
          text: [`${data.category}`],
          style: "description",
        },
        {
          text: [`${data.content}`],
          style: "description",
        },
      ],
      defaultStyle: {
        font: "Helvetica",
      },
      styles: {
        header: {
          fontSize: 20,
          bold: true,
        },
        description: {
          fontSize: 16,
          bold: false,
        },
      },
    };

    const options = {
      //
    };

    const pdfReadableStream = printer.createPdfKitDocument(
      docDefinition,
      options
    );
    // pdfReadableStream.pipe(fs.createWriteStream('document.pdf')); // old syntax for piping
    // pipeline(pdfReadableStream, fs.createWriteStream('document.pdf')) // new syntax for piping (we don't want to pipe pdf into file on disk right now)
    pdfReadableStream.end();
    const path = join(dirname(fileURLToPath(import.meta.url)), "example.pdf");
    await asyncPipeline(pdfReadableStream, fs.createWriteStream(path));
    return path;
  }
};

// promisify = () => new Promise((res, rej) => pipeline())
