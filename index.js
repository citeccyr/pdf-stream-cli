#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const program = require('commander');
const pdf_stream = require('pdf-stream');
const package_json = require('./package.json');

global.DOMParser = require('xmldom').DOMParser; // Fix: for missing DOMParser if PDF.js found metadata in string format

const PDFReadable = pdf_stream.PDFReadable;
const PDFStringifyTransform = pdf_stream.PDFStringifyTransform;


let input_stream = process.stdin;
let output_stream = process.stdout;
let waiting_for_stdin = true;

//noinspection JSAnnotator
program
  .version(package_json.version, '-v, --version')
  .description('Defaults:' +
    '\n    input_file\t- STDIN' +
    '\n    output_file\t- STDOUT')
  .option('-w, --whitespace []', 'whitespace replacement. Ignored for type `json`. Defaut: `` empty string.', '')
  .option('-t, --type [text]', 'type: text or json. Default: `text`.', 'text')
  .arguments('[input_file] [output_file]')
  .action(function (input, output) {
    //console.log('action arguments', input, output);
    // Create output and write streams
    try {
      if (input
        && typeof input === 'string'
        && fs.existsSync(input)) {
        input_stream = fs.createReadStream(input);
        //console.log('input is exists', input);
        waiting_for_stdin = false;
      } else {
        //console.warn('Warning: input_file is not exists, use STDIN');
      }

      if (output
        && typeof output === 'string'
        && fs.existsSync(
          path.dirname(output)
        )) {
        output_stream = fs.createWriteStream(output);
        //console.log('output directory is exists');
      } else {
        //console.warn('Warning: output_file directory is not exists, use STDOUT');
      }
    } catch (e) {
      console.error(e.message);
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
}, 1000);

let buffers = [];
input_stream
  .on('data', (chunk) => {
    waiting_for_stdin = false;
    buffers.push(chunk);
  })
  .on('end', () => {
    let buffer = Buffer.concat(buffers);
    let src = new Uint8Array(buffer);


    switch (program.type) {

      case 'text':
        new PDFReadable(src)
          .on('error', function (err) {
            console.error('PDFReadable error', err);
          })
          .pipe(new PDFStringifyTransform({whitespace: program.whitespace}))
          .pipe(output_stream)
        ;
        break;

      case 'json':
        let objects = [];
        new PDFReadable(src)
          .on('error', function(err){
            console.error('PDFReadable error', err);
          })
          .on('data', function(data){
            //console.log('data', data)
            objects.push(data);
          })
          .on('end', function(){
            //console.log('end');
            output_stream.end(
              JSON.stringify(objects)
            );
          });

        break;
    }
  });


output_stream.on('finish', () => {
  //console.log('Finish writing of output_stream')
});