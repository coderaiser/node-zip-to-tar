# zip-to-tar [![License][LicenseIMGURL]][LicenseURL] [![NPM version][NPMIMGURL]][NPMURL] [![Dependency Status][DependencyStatusIMGURL]][DependencyStatusURL] [![Build Status][BuildStatusIMGURL]][BuildStatusURL] [![Coverage Status][CoverageIMGURL]][CoverageURL]

Convert zip archives to tar.

## Global

`zip-to-tar` could be installed globally and used as `zip-to-tar` or `zip2tar`:

```
npm i zip-to-tar -g
```

### Usage

Convert all `zip` archives to `tar.gz` in same directory:

```
zip2tar *.zip
```

> Make every program a filter
>
> (c) Mike Gancarz: The UNIX Philosophy

Convert `zip` data from `stdin` and pipe it to `stdout`.

```
cat arc.zip | zip2tar > arc.tar
```

## Local

`zip-to-tar` could be used localy. It will emit event on every file from converted archive.

## Install

```
npm i zip-to-tar --save
```

## API

`zip-to-tar` can work with `filename` and `ReadableStream`. When `filename` used `zip-to-tar` can emit
progress of coverting (with `options`: `{progress: true}`).

### zipToTar(filename, options)

- `filename` - **string** name of the file
- `options` - **object** with properties:
  - `progress` - whether emit `progress` event.

```js
const zipToTar = require('zip-to-tar');
const fs = require('fs');
const {stdout} = process;
const onProgress = (n) => {
    stdout.write(`\r${n}`);
};

const onFinish = (e) => {
    stdout.write('\n');
};

const onError = ({message}) => {
    console.error(message)
};

const tar = fs.createWriteStream('file.tar');
const progress = true;

zipToTar('file.zip', {progress})
    .on('progress', onProgress)
    .on('file', console.log)
    .on('error', onError);
    .getStream()
    .pipe(tar)
    .on('finish', onFinish);

```

### zipToTar(buffer)

- `buffer` - **Buffer** with `zip` data.

```js
const zipToTar = require('zip-to-tar');
const fs = require('fs');
const {stdout} = process;

const onProgress = (n) => {
    stdout.write(`\r${n}`);
};

const onFinish = (e) => {
    stdout.write('\n');
};

const onError = ({message}) => {
    console.error(message)
};

const zip = fs.readFileSync('file.zip');
const tar = fs.createReadStream('file.tar');
const progress = true;

zipToTar(zip, {progress})
    .on('file', console.log)
    .on('error', onError);
    .getStream()
    .pipe(tar)
    .on('finish', onFinish);
```

## Related

- [Jaguar](https://github.com/coderaiser/node-jaguar "Jaguar") - Pack and extract .tar.gz archives with emitter.
- [OneZip](https://github.com/coderaiser/node-onezip "OneZip") - Pack and extract zip archives with emitter.
- [tar-to-zip](https://github.com/coderaiser/node-tar-to-zip "Tar To Zip") - Convert tar and tar.gz archives to zip.

## License

MIT

[NPMIMGURL]:                https://img.shields.io/npm/v/zip-to-tar.svg?style=flat
[BuildStatusIMGURL]:        https://img.shields.io/travis/coderaiser/node-zip-to-tar/master.svg?style=flat
[DependencyStatusIMGURL]:   https://img.shields.io/gemnasium/coderaiser/node-zip-to-tar.svg?style=flat
[LicenseIMGURL]:            https://img.shields.io/badge/license-MIT-317BF9.svg?style=flat
[NPMURL]:                   https://npmjs.org/package/zip-to-tar "npm"
[BuildStatusURL]:           https://travis-ci.org/coderaiser/node-zip-to-tar  "Build Status"
[DependencyStatusURL]:      https://gemnasium.com/coderaiser/node-zip-to-tar "Dependency Status"
[LicenseURL]:               https://tldrlegal.com/license/mit-license "MIT License"

[CoverageURL]:              https://coveralls.io/github/coderaiser/node-zip-to-tar?branch=master
[CoverageIMGURL]:           https://coveralls.io/repos/coderaiser/node-zip-to-tar/badge.svg?branch=master&service=github

