
/*jslint browser: true, node: true */
/*global require, module, describe, it */

"use strict";

import { equal, doesNotThrow } from "assert";
import { readFileSync } from 'fs';

import { Utils, isCompressed, readHeader, readImage } from '../src/nifti.js';

var buf = readFileSync('./tests/data/5D_small.nii');
var data = Utils.toArrayBuffer(buf);
var nifti1 = null;
var imageData = null;

describe('NIFTI-Reader-JS', function () {
    describe('uncompressed 5D nifti-1 test', function () {
        it('isCompressed() should return false', function () {
            equal(false, isCompressed(data));
        });

        it('should not throw error when reading header', function (done) {
            doesNotThrow(function() {
                nifti1 = readHeader(data);
                done();
            });
        });

        it('dims[1] should be 1', function () {
            equal(1, nifti1.dims[1]);
        });

        it('dims[2] should be 2', function () {
            equal(2, nifti1.dims[2]);
        });

        it('dims[3] should be 3', function () {
            equal(3, nifti1.dims[3]);
        });

        it('dims[4] should be 1', function () {
            equal(1, nifti1.dims[4]);
        });

        it('dims[5] should be 3', function () {
            equal(3, nifti1.dims[5]);
        });

        it('image size should equal 1 * 2 * 3 * 1 * 3', function () {
            imageData = readImage(nifti1, data);
            equal(18, imageData.byteLength);
        });

        it('image data checksum should equal 1033497386', function () {
            var imageData = readImage(nifti1, data);
            var checksum = Utils.crc32(new DataView(imageData));
            equal(checksum, 1168954819);
        });
    });
});
