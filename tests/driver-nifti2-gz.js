
/*jslint browser: true, node: true */
/*global require, module, describe, it */

"use strict";

import { equal, doesNotThrow, deepEqual } from "assert";
import { readFileSync } from 'fs';

import { Utils, isCompressed, decompress, isNIFTI1, isNIFTI2, readHeader, readImage } from '../src/index';

var buf = readFileSync('./tests/data/avg152T1_LR_nifti2.nii.gz');
var data = Utils.toArrayBuffer(buf);
var nifti2 = null;
var bytes = null;
var clone = null;

describe('NIFTI-Reader-JS', function () {
    describe('compressed nifti-2 test', function () {
        it('isCompressed() should return true', function () {
            equal(true, isCompressed(data));
        });

        it('should not throw error when decompressing', function (done) {
            doesNotThrow(function() {
                data = decompress(data);
                done();
            });
        });

        it('isNIFTI1() should return false', function () {
            equal(false, isNIFTI1(data));
        });

        it('isNIFTI2() should return true', function () {
            equal(true, isNIFTI2(data));
        });

        it('should not throw error when reading header', function (done) {
            doesNotThrow(function() {
                nifti2 = readHeader(data);
                done();
            });
        });

        it('dims[1] should be 91', function () {
            equal(91, nifti2.dims[1]);
        });

        it('dims[2] should be 109', function () {
            equal(109, nifti2.dims[2]);
        });

        it('dims[3] should be 91', function () {
            equal(91, nifti2.dims[3]);
        });

        it('image data checksum should equal 471047545', function () {
            var imageData = readImage(nifti2, data);
            var checksum = Utils.crc32(new DataView(imageData));
            equal(checksum, 471047545);
        });

        it('data returned from toArrayBuffer preserves all nifti-2 properties', function() {
            bytes = nifti2.toArrayBuffer();
            clone = readHeader(bytes);
            deepEqual(clone, nifti2);
        });

    });
});
