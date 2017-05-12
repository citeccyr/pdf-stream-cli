#!/usr/bin/env node
'use strict';

const WAIT_FOR_STDIN = 5000;

const fs = require('fs');
const path = require('path');
const url = require('url');
const program = require('commander');
const pdf_stream = require('pdf-stream');
const package_json = require('./package.json');

global.XMLHttpRequest = require('xhr2'); // Added: HTTP input_file
global.DOMParser = require('xmldom').DOMParser; // Fix: for missing DOMParser if PDF.js found metadata in string format

const PDFReadable = pdf_stream.PDFReadable;
const PDFStringifyTransform = pdf_stream.PDFStringifyTransform;


let input_stream = process.stdin;
let output_stream = process.stdout;
let waiting_for_stdin = true;
let output_is_stdout = true;

//noinspection JSAnnotator
program
  .version(package_json.version, '-v, --version')
  .description('Defaults:' +
    '\n    input (file or URI)\t- STDIN' +
    '\n    output_file\t\t- STDOUT')
  .option('-w, --whitespace []', 'whitespace replacement. Ignored for type `json`. Defaut: `` empty string.', '')
  .option('-t, --type [text]', 'type: text or json. Default: `text`.', 'text')
  .arguments('[input] [output_file]')
  .action(function (input, output) {
    //console.log('action arguments', input, output);
    // Create output and write streams
    try {
      if (input
        && typeof input === 'string') {
        if (fs.existsSync(input)) {
          input_stream = fs.createReadStream(input);
          //console.log('input is exists', input);
          waiting_for_stdin = false;
          output_file_check();
        } else {
          let parsed_url = url.parse(input);
          //console.log('parsed_url', parsed_url);
          if (typeof parsed_url.hostname !== 'undefined') {
            waiting_for_stdin = false;
            output_file_check(() => {
              convert_pdf(input);
            });
          }
        }
      } else {
        //console.warn('Warning: input_file is not exists, use STDIN');
      }


    } catch (e) {
      console.error(e.message);
    }

    /**
     * Output file check
     * @param callback
     */
    function output_file_check(callback) {
      if (output
        && typeof output === 'string'
        && fs.existsSync(
          path.dirname(output)
        )) {
        output_stream = fs.createWriteStream(output);
        //console.log('output directory is exists');

        if (typeof callback === 'function') {
          callback();
        }
      } else {
        //console.warn('Warning: output_file directory is not exists, use STDOUT');
        output_is_stdout = true;
        callback();
      }

    }


  })
  .parse(process.argv)
;

//console.log('whitespace', '`' + program.whitespace + '`', program.whitespace.length);
//console.log('type', program.type);
//console.log('program', program);

setTimeout(function () {
  if (waiting_for_stdin) {
    console.log('Waiting for STDIN...' +
      '\nIf you are stuck press Ctrl+C and run program with --help option');
  }
}, WAIT_FOR_STDIN);

let buffers = [];
input_stream
  .on('data', (chunk) => {
    waiting_for_stdin = false;
    buffers.push(chunk);
  })
  .on('end', () => {
    let buffer = Buffer.concat(buffers);
    let src = new Uint8Array(buffer);

    convert_pdf(src);
  });

/**
 * Convert PDF to type
 * based `program.type`
 * @param src
 */
function convert_pdf(src) {
  switch (program.type) {

    case 'text':
      new PDFReadable(src)
        .on('error', function (err) {
          console.error('PDFReadable error', err);
          process.exit(1);
        })
        .on('end', function () {
          //console.log('end');
          //process.exit(0);
        })
        .pipe(new PDFStringifyTransform({whitespace: program.whitespace}))
        .pipe(output_stream)
      ;
      break;

    case 'json':
      let objects = [];
      new PDFReadable(src)
        .on('error', function (err) {
          console.error('PDFReadable error', err);
          process.exit(1);
        })
        .on('data', function (data) {
          //console.log('data', data)
          objects.push(data);
        })
        .on('end', function () {
          //console.log('end');
          // Fix: circular references in JSON
          if (objects
            && typeof objects[0] === 'object'
            && typeof objects[0].metadata === 'object'
            && typeof objects[0].metadata.metadata !== 'undefined'
          ) {
            //console.log('first chunk - before', objects[0]);
            delete objects[0].metadata.metadata;
            //console.log('first chunk - after', objects[0]);
          }

          output_stream.write(JSON.stringify(objects), () => {
            //console.log('Output stream after end');
            // Fix: Cannot close STDOUT
            if (!output_is_stdout) {
              output_stream.end(); // Process exit automatically
            } else {
              process.exit();       // Force exit
            }
          });
        });

      break;
  }
}

output_stream.on('finish', () => {
  //console.log('Finish writing of output_stream');
  //process.exit();
});

process.on('exit', () => {
  //console.log('process exit');
});