# PDF stream CLI

> Convert PDF to text or JSON

Node.js global module for converting PDF in terminal.

Based on [pdf-stream](https://www.npmjs.com/package/pdf-stream) module and [PDF.js](https://github.com/mozilla/pdf.js) library.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [License](#license)

## Install

### Prerequisites

You need [Node.js](https://nodejs.org/) and NPM. Then install node module globally:

```bash
  npm install -g pdf-stream-cli
```


## Usage

### Output text from PDF URI to STDOUT

```bash
  pdf-stream-cli https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf 
   ```

### Get JSON with text objects from PDF

```bash
  pdf-stream-cli --type json https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf ./out/text.json
```

### Show help

```bash
  pdf-stream-cli --help
```

Output:

```

  pdf-stream-cli [options] [input] [output_file]
  
    Defaults:
      input (file or URI) - STDIN
      output_file         - STDOUT
  
    Options:
  
      -h, --help           output usage information
      -v, --version        output the version number
      -w, --whitespace []  whitespace replacement. Ignored for type `json`. Defaut: `` empty string.
      -t, --type [text]    type: text or json. Default: `text`.


```

## Contribute

Contributors are welcome. [Open an issue](https://github.com/citeccyr/pdf-stream-cli/issues/new) or submit pull request.

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

Apache 2.0

© Sergey N