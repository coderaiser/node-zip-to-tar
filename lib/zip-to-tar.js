'use strict';

const fs = require('fs');
const EventEmitter = require('events').EventEmitter;
const inherits = require('util').inherits;
const Readable = require('stream').Readable;

const tarStream = require('tar-stream');
const gunzipMaybe = require('gunzip-maybe');
const yauzl = require('yauzl');
const pullout = require('pullout');

const isString = (a) => typeof a === 'string';
const isBuffer = (a) => a instanceof Buffer;

inherits(ZipToTar, EventEmitter);

module.exports = (file, options = {}) => {
    check(file, options);
    
    const isProgress = options.progress;
    const emitter = new ZipToTar(file, options);
    
    process.nextTick(() => {
        if (!isProgress)
            emitter.convert(file);
        else
            emitter._parse(file, () => {
                emitter._convert(file);
            });
    });
    
    return emitter;
};

function ZipToTar(file, options) {
    EventEmitter.call(this);
    
    this._tar = tarStream.pack();
    this.getStream = () => {
        console.log(this._tar);
        return this._tar;
    };
    
    this._n = 0;
    this._i = 0;
    this._percent = 0;
    this._percentPrev = 0;
    
    this._isProgress = options.progress;
}

ZipToTar.prototype._progress = function() {
    if (!this._isProgress)
        return;
    
    ++this._i;
    
    const value = Math.round(this._i * 100 / this._n);
    
    this._percent = value;
    
    if (value !== this._percentPrev) {
        this._percentPrev = value;
        this.emit('progress', value);
    }
};

ZipToTar.prototype._parse = function(file, done){
    const inc = () => ++this._n;
    const emitError = (e) => {
        this.emitError(e);
    };
    
    const parse = (e, zip) => {
        if (e)
            return emitError(e);
        
        zip
            .on('entry', inc)
            .on('error', emitError)
            .on('end', done);
    };
    
    if (isBuffer(file))
        yauzl.fromBuffer(file, parse)
    else
        yauzl.open(file, parse);
};

ZipToTar.prototype.emitError = function(error) {
    this.emit('error', error);
}

ZipToTar.prototype._convert = function(file) {
    const tar = this._tar;
    const convert = (e, zip) => {
        if (e)
            return this.emitError(e);
        
        zip.once('end', () => {
            zip.close();
            tar.finalize();
        });
    
        zip.readEntry();
        zip.on('entry', (entry) => {
            const fileName = entry.fileName;
            
            if (/\/$/.test(fileName)) {
                tar.entry({
                    name: fileName,
                    type: 'directory'
                });
                
                this.emit('filename', fileName);
                this._progress();
            } else {
                zip.openReadStream(entry, (e, stream) => {
                    if (e)
                        return this.emitError(e);
                    
                    pullout(stream, (e, buffer) => {
                        if (e)
                            return this.emitError(e);
                        
                        tar.entry({
                            name: fileName
                        }, buffer);
                        
                        this.emit('filename', fileName);
                        this._progress();
                    });
                });
            }
        });
    };
    
    const lazyEntries = true;
    
    if (isBuffer(file))
        yauzl.fromBuffer(file, {lazyEntries}, convert);
    else
        yauzl.open(file, {lazyEntries}, convert);
};

function check(file, options) {
    if (!file)
        throw Error('file could not be empty!');
    
    if (!isString(file) && !isBuffer(file))
        throw Error('file could be String or Readable Stream only!');
}

