
/*jslint browser: true, node: true */
/*global require, module, describe, it */

"use strict";

import { doesNotThrow, equal } from "assert";
import { readFileSync } from 'fs';

import { Utils, decompress, isNIFTI1, readHeader, hasExtension, readExtensionData, NIFTIEXTENSION } from '../src/nifti.js';

// var buf = fs.readFileSync('./tests/data/afni.nii.gz');
var buf = readFileSync('./tests/data/with_extension.nii.gz');
var data = Utils.toArrayBuffer(buf);
var nifti1 = null;
var extension = null;
const EXPECTED_EXTENSION_LENGTH = 376;

describe('NIFTI-Reader-JS', function () {
    describe('nifti-1 extension test', function () {
        it('should not throw error when decompressing', function (done) {
            doesNotThrow(function() {
                data = decompress(data);
                done();
            });
        });

        it('isNIFTI1() should return true', function () {
            equal(true, isNIFTI1(data));
        });

        it('should not throw error when reading header', function (done) {
            doesNotThrow(function() {
                nifti1 = readHeader(data);
                done();
            });
        });

        it('hasExtension() should return true', function () {
            equal(true, hasExtension(nifti1));
        });

        it('extension length should be 376 (384 - 8)', function () {
            equal(EXPECTED_EXTENSION_LENGTH + 8, nifti1.getExtensionSize(new DataView(data)));
            
            equal(EXPECTED_EXTENSION_LENGTH, readExtensionData(nifti1, data).byteLength);
        });

        it('should have one extension that is 376 bytes', function() {
            extension = nifti1.extensions[0];
            equal(EXPECTED_EXTENSION_LENGTH, extension.edata.byteLength);
            equal(1, nifti1.extensions.length);
        });

        it('removed extension changes the vox offset', function() {
            extension = nifti1.extensions[0];
            equal(EXPECTED_EXTENSION_LENGTH, extension.edata.byteLength);
            equal(1, nifti1.extensions.length);
        });

        it('removed extension updates the vox offset', function() {            
            let oldVoxOffset = nifti1.vox_offset;
            nifti1.removeExtension(0);
            equal(0, nifti1.extensions.length);
            equal(nifti1.vox_offset + extension.esize, oldVoxOffset); 
        });

        it('added extension updates vox_offset', function() {
            let oldVoxOffset = nifti1.vox_offset;
            nifti1.addExtension(extension);
            equal(1, nifti1.extensions.length);
            equal(nifti1.vox_offset, oldVoxOffset + extension.esize); 
        });

        it('toArrayBuffer properly allocates extension byte array', function() {
            equal(1, nifti1.extensions.length);
            let bytesWithHeader = nifti1.toArrayBuffer(true);
            let bytesWithoutHeader = nifti1.toArrayBuffer();
            let headerBytesGreater = bytesWithHeader.byteLength > bytesWithoutHeader.byteLength;
            
            equal(true, headerBytesGreater);
        });

        it('toArrayBuffer properly preserves extension bytes', function() {
            let bytes = nifti1.toArrayBuffer(true);
            let copy = readHeader(bytes);
            equal(1, copy.extensions.length);
            equal(EXPECTED_EXTENSION_LENGTH, copy.extensions[0].edata.byteLength);
        });

        it('extensions can be added and serialized', function() {
            let edata = new Int32Array(6);
            edata.fill(8);
            let newExtension = new NIFTIEXTENSION(32, 4, edata.buffer, true);
            nifti1.addExtension(newExtension);
            equal(2, nifti1.extensions.length);
            let bytes = nifti1.toArrayBuffer(true);
            let copy = readHeader(bytes);
            equal(2, copy.extensions.length);
            equal(4, copy.extensions[1].ecode);
            equal(24, copy.extensions[1].edata.byteLength);
        });

        it('extensions can be removed by index', function() {
            nifti1.removeExtension(1);
            equal(1, nifti1.extensions.length);
            let bytes = nifti1.toArrayBuffer(true);
            let copy = readHeader(bytes);
            equal(1, copy.extensions.length);
            equal(EXPECTED_EXTENSION_LENGTH, copy.extensions[0].edata.byteLength);
        })

        it('extensions can be inserted and serialized', function() {
            let newExtension = new NIFTIEXTENSION(32, 4, new Uint8Array(16), true);
            nifti1.addExtension(newExtension, 0);
            equal(2, nifti1.extensions.length);
            let bytes = nifti1.toArrayBuffer(true);
            let copy = readHeader(bytes);
            equal(2, copy.extensions.length);
            equal(4, copy.extensions[0].ecode);
            equal(32, copy.extensions[0].esize);
            equal(24, copy.extensions[0].edata.byteLength);
            
        })

    });
});
