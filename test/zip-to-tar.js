'use strict';

const fs = require('fs');
const path = require('path');

const test = require('tape');
const pullout = require('pullout');

const zip2tar = require('..');

const noop = () => {};

const getFixtureZip = (str = '') => {
    return path.join(__dirname, 'fixture/fixture.zip' + str);
};

const getFixtureTar = (str = '') => {
    return path.join(__dirname, 'fixture/fixture.tar' + str);
};

const getFixtureZipDir = (str = '') => {
    return path.join(__dirname, 'fixture/fixture.dir.zip' + str);
};

const getFixtureZip101Files = (str = '') => {
    return path.join(__dirname, 'fixture/101-files.zip' + str);
};

const getFixtureTarDir = (str = '') => {
    return path.join(__dirname, 'fixture/fixture.dir.tar' + str);
};

const getFixtureTar101Files = (str = '') => {
    return path.join(__dirname, 'fixture/101-files.tar' + str);
};

const getFixtureText = () => {
    return path.join(__dirname, 'fixture/fixture.txt');
};

const getFixtureTextStream = () => {
    return fs.createReadStream(getFixtureText());
};

const getFixtureZipStream = () => {
    return fs.createReadStream(getFixtureZipDir());
};

const getFixtureZipDirStream = () => {
    return fs.createReadStream(getFixtureZip());
};

test('zip2tar: args: no', (t) => {
    t.throws(zip2tar, /file could not be empty!/, 'should throw when no file');
    t.end();
});

test('zip2tar: args: file: wrong type', (t) => {
    const fn = () => zip2tar(5);
    
    t.throws(fn, /file could be String or Buffer only!/, 'should throw when no args');
    t.end();
});

test('zip2tar: args: options: when file is stream', (t) => {
    const file = fs.createReadStream('hello')
        .on('error', noop);
    
    const fn = () => zip2tar(file);
    
    t.throws(fn, /file could be String or Buffer only!/, 'should throw when no args');
    t.end();
});

test('zip2tar: filename: error: file is absent', (t) => {
    zip2tar(getFixtureZip('1'))
        .on('error', (e) => {
            t.ok(/ENOENT/.test(e.message), 'should emit error when can not file file');
            t.end();
        });
});

test('zip2tar: filename: error: not a tar', (t) => {
    const expect = 'end of central directory record signature not found';
    
    zip2tar(getFixtureText())
        .on('error', (e) => {
            t.equal(e.message, expect, 'should emit error when can not pack');
            t.end();
        });
});

test('zip2tar: files', (t) => {
    const stream = zip2tar(getFixtureZip())
        .getStream()
    
    pullout(stream, (e, buffer) => {
        const tarLength = fs.readFileSync(getFixtureTar()).length;
        t.equal(tarLength, buffer.length, 'should equal');
        t.end();
    });
});

test('zip2tar: files: progress', (t) => {
    const stream = zip2tar(getFixtureZip(), {
        progress: true
    })
        .on('progress', (a) => {
            t.equal(a, 100, 'should equal');
        })
        .on('end', () => {
            t.end();
        });
});

test('zip2tar: dir', (t) => {
    const stream = zip2tar(getFixtureZipDir())
        .getStream();
    
    pullout(stream, (e, buffer) => {
        const tarLength = fs.readFileSync(getFixtureTarDir()).length;
        t.equal(tarLength, buffer.length, 'should equal');
        t.end();
    });
});

test('zip2tar: dir: progress', (t) => {
    const progress = true;
    const stream = zip2tar(getFixtureZip101Files(), {progress})
        .getStream();
    
    pullout(stream, (e, buffer) => {
        const tarLength = fs.readFileSync(getFixtureTar101Files()).length;
        t.equal(tarLength, buffer.length, 'should equal');
        t.end();
    });
});

test('zip2tar: buffer', (t) => {
    const zip = fs.readFileSync(getFixtureZip());
    const stream = zip2tar(zip)
        .getStream()
    
    pullout(stream, (e, buffer) => {
        const tarLength = fs.readFileSync(getFixtureTar()).length;
        t.equal(tarLength, buffer.length, 'should equal');
        t.end();
    });
});

