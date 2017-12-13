'use strict';

const fs = require('fs');
const EventEmitter = require('events').EventEmitter;
const inherits = require('util').inherits;

const pullout = require('pullout/legacy');
const tarStream = require('tar-stream');
const gunzipMaybe = require('gunzip-maybe');
const yauzl = require('yauzl');

const isString = (a) => typeof a === 'string';
const isBuffer = (a) => a instanceof Buffer;

inherits(ZipToTar, EventEmitter);

module.exports = (file, options = {}) => {
    check(file, options);
    
    const isProgress = options.progress;
    const emitter = new ZipToTar(options);
    
    process.nextTick(() => {
        if (!isProgress)
            return emitter._convert(file);
        
        emitter._parse(file, (error) => {
            emitter._convert(file);
        });
    });
    
    return emitter;
};

function ZipToTar(options) {
    EventEmitter.call(this);
    this._tar = tarStream.pack();
   
    this.getStream = () => {
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
    const emitError = this.emitError.bind(this);
    const parse = (e, zip) => {
        const inc = () => {
            ++this._n;
            zip.readEntry();
        };
        
        zip.readEntry();
        zip
            .on('entry', inc)
            .on('error', emitError)
            .on('end', done);
    };
    
    openZipFile(file, parse);
};

ZipToTar.prototype.emitError = function(error) {
    this.emit('error', error);
}

ZipToTar.prototype._convert = function(file) {
    const tar = this._tar;
    const convert = (e, zip) => {
        if (e)
            return this.emitError(e);
        
        const onError = this.emitError.bind(this);
        
        zip.once('end', () => {
            zip.close();
            tar.finalize();
            
            this.emit('end');
        });
        
        zip.on('error', onError);
        zip.readEntry();
        zip.on('entry', (entry) => {
            const fileName = entry.fileName;
            const size = entry.uncompressedSize;
            
            if (/\/$/.test(fileName)) {
                tar.entry({
                    name: fileName,
                    type: 'directory'
                });
                
                this.emit('filename', fileName);
                this._progress();
                zip.readEntry();
                return;
            }
            
            zip.openReadStream(entry, (e, stream) => {
                const onError = this.emitError.bind(this);
                
                const onEnd = (e) => {
                    this.emit('filename', fileName);
                    this._progress();
                    zip.readEntry();
                };
                
                const tarFile = tar.entry({
                    name: fileName,
                    size,
                }, onEnd);
                
                stream
                    .on('error', onError)
                    .pipe(tarFile)
            });
        });
    };
    
    openZipFile(file, convert);
};

function openZipFile(file, fn) {
    const lazyEntries = true;
    
    if (isBuffer(file))
        return yauzl.fromBuffer(file, {lazyEntries}, fn);
    
    yauzl.open(file, {lazyEntries}, fn);
}

function check(file, options) {
    if (!file)
        throw Error('file could not be empty!');
    
    if (!isString(file) && !isBuffer(file))
        throw Error('file could be String or Buffer only!');
}

