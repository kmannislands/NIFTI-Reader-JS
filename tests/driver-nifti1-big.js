
/*jslint browser: true, node: true */
/*global require, module, describe, it */

"use strict";

import { equal, doesNotThrow } from "assert";
import { readFileSync } from 'fs';

import { Utils, isCompressed, decompress, isNIFTI1, readHeader, readImage } from '../src/nifti.js';

var buf = readFileSync('./tests/data/big.nii.gz');
var data = Utils.toArrayBuffer(buf);
var nifti1 = null;

describe('NIFTI-Reader-JS', function () {
    describe('nifti-1 big endian test', function () {
        it('isCompressed() should return true', function () {
            equal(true, isCompressed(data));
        });

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

        it('numBitsPerVoxel should be 32', function () {
            equal(32, nifti1.numBitsPerVoxel);
        });

        it('littleEndian should be false', function () {
            equal(false, nifti1.littleEndian);
        });

        it('dims[1] should be 64', function () {
            equal(64, nifti1.dims[1]);
        });

        it('dims[2] should be 64', function () {
            equal(64, nifti1.dims[2]);
        });

        it('dims[3] should be 21', function () {
            equal(21, nifti1.dims[3]);
        });

        it('image data checksum should equal 3243691439', function () {
            var imageData = readImage(nifti1, data);
            var checksum = Utils.crc32(new DataView(imageData));
            equal(checksum, 3243691439);
        });
    });
});
