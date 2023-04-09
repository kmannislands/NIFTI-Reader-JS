
/*jslint browser: true, node: true */
/*global require, module, describe, it */

"use strict";

import { equal, doesNotThrow, deepEqual } from "assert";
import { readFileSync } from 'fs';

import { Utils, isCompressed, isNIFTI1, isNIFTI, readHeader, readImage } from '../src/nifti.js';

var buf = readFileSync('./tests/data/avg152T1_LR_nifti.nii');
var data = Utils.toArrayBuffer(buf);
var nifti1 = null;
var bytes = null;
var clone = null;

describe('NIFTI-Reader-JS', function () {
    describe('uncompressed nifti-1 test', function () {
        it('isCompressed() should return false', function () {
            equal(false, isCompressed(data));
        });

        it('isNIFTI1() should return true', function () {
            equal(true, isNIFTI1(data));
        });

        it('isNIFTI() should return true', function () {
            equal(true, isNIFTI(data));
        });

        it('should not throw error when reading header', function (done) {
            doesNotThrow(function() {
                nifti1 = readHeader(data);
                done();
            });
        });

        it('dims[1] should be 91', function () {
            equal(91, nifti1.dims[1]);
        });

        it('dims[2] should be 109', function () {
            equal(109, nifti1.dims[2]);
        });

        it('dims[3] should be 91', function () {
            equal(91, nifti1.dims[3]);
        });

        it('image data checksum should equal 1033497386', function () {
            var imageData = readImage(nifti1, data);
            var checksum = Utils.crc32(new DataView(imageData));
            equal(checksum, 1033497386);
        });


        it('data returned from toArrayBuffer preserves all nifti-1 properties', function() {
            nifti1 = readHeader(data);
            bytes = nifti1.toArrayBuffer();
            clone = readHeader(bytes);
            deepEqual(clone, nifti1);
        });
    });
});
