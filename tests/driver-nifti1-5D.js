
/*jslint browser: true, node: true */
/*global require, module, describe, it */

"use strict";

import { equal, doesNotThrow } from "assert";
import { readFileSync } from 'fs';

import { Utils, isCompressed, decompress, readHeader, readImage } from '../src/nifti.js';

var buf = readFileSync('./tests/data/5D_zeros.nii.gz');
var data = Utils.toArrayBuffer(buf);
var nifti1 = null;
var imageData = null;

describe('NIFTI-Reader-JS', function () {
    describe('compressed 5D nifti-1 test', function () {
        it('isCompressed() should return true', function () {
            equal(true, isCompressed(data));
        });

        it('should not throw error when decompressing', function (done) {
            doesNotThrow(function() {
                data = decompress(data);
                done();
            });
        });
        
        it('should not throw error when reading header', function (done) {
            doesNotThrow(function() {
                nifti1 = readHeader(data);
                done();
            });
        });

        it('dims[1] should be 256', function () {
            equal(256, nifti1.dims[1]);
        });

        it('dims[2] should be 256', function () {
            equal(256, nifti1.dims[2]);
        });

        it('dims[3] should be 170', function () {
            equal(170, nifti1.dims[3]);
        });

        it('dims[4] should be 1', function () {
            equal(1, nifti1.dims[4]);
        });

        it('dims[5] should be 3', function () {
            equal(3, nifti1.dims[5]);
        });

        it('image size should equal 33423360', function () {
            imageData = readImage(nifti1, data);
            equal(33423360, imageData.byteLength);
        });

        it('image data checksum should equal 1033497386', function () {
            var imageData = readImage(nifti1, data);
            var checksum = Utils.crc32(new DataView(imageData));
            equal(checksum, 2980574675);
        });
    });
});
