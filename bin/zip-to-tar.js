#!/usr/bin/env node

'use strict';

const args = process.argv.slice(2)
const arg = args[0];

const isTTY = process.stdin.isTTY;

if (/^(-v|--version)$/.test(arg)) {
    version();
} else if (!arg && isTTY || /^(-h|--help)$/.test(arg)) {
    help();
} else if (args.length) {
    eachSeries(args, main, exitIfError);
} else {
    const zipToTar = require('..');
    const pullout = require('pullout');
    const zlib = require('zlib');
    
    pullout(process.stdin, (e, buffer) => {
        exitIfError(e);
        
        zipToTar(buffer)
            .getStream()
            .on('error', exitIfError)
            .pipe(zlib.createGzip())
            .pipe(process.stdout);
    });
}

function getZipPath(name) {
    if (/^(\/|~)/.test(name))
        return name;
    
    const cwd = process.cwd();
    return cwd + '/' + name;
}

function getTarPath(name) {
    const reg = /\.zip/;
    
    if (reg.test(name))
        return name.replace(reg, '.tar.gz');
    
    return name + '.tar.gz';
}

function main(name, done) {
    const zipToTar = require('..');
    const fs = require('fs');
    const zlib = require('zlib');
    
    const onProgress = (n) => {
        process.stdout.write(`\r${n}%: ${name}`);
    };
    
    const onFinish = () => {
        process.stdout.write('\n');
        done();
    };
    
    const pathZip = getZipPath(name);
    const pathTar = getTarPath(pathZip);
    
    const tar = fs.createWriteStream(pathTar)
        .on('error', (e) => {
            fs.unlink(pathTar, exitIfError);
            exitIfError(e);
        });
    
    const progress = true;
    
    zipToTar(pathZip, {progress})
        .on('progress', onProgress)
        .getStream()
        .pipe(zlib.createGzip())
        .pipe(tar)
        .on('close', onFinish);
}

function exitIfError(e) {
    if (!e)
        return;
    
    console.error(e.message);
    process.exit(1);
}

function version() {
    console.log('v' + info().version);
}

function info() {
    return require('../package');
}

function help() {
    const bin = require('../help');
    const usage = `Usage: ${info().name} [filename]`;
    
    console.log(usage);
    console.log('Options:');
    
    Object.keys(bin).forEach((name) => {
        console.log(`  ${name} ${bin[name]}`);
    });
}

function eachSeries(array, iterator, done) {
    check(array, iterator, done);
    
    let i = -1;
    const n = array.length;
    
    const loop = (e) => {
       ++i;
       
       if (e || i === n)
           return done(e);
       
       iterator(array[i], loop);
    };
    
    loop();
}

function check(array, iterator, done) {
    if (!Array.isArray(array))
        throw Error('array should be an array!');
    
    if (typeof iterator !== 'function')
        throw Error('iterator should be a function');
    
    if (typeof done !== 'function')
        throw Error('done should be a function');
}

