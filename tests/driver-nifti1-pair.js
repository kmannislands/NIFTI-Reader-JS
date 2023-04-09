
/*jslint browser: true, node: true */
/*global require, module, describe, it */

/*NIfTI files can be single file (.nii) or pairs (.hdr; .img) */
/*To create paired NIfTI images */
/*  $ FSLOUTPUTTYPE=NIFTI_PAIR_GZ */
/*  $ fslmaths AIR.nii.gz -add 0 air */

/* If you can support paired files you must pass `true` as second parameter: */
/* isNIFTI2() isNIFTI1(), isNIFTI() */
/* you must read two files (header and image), in this example buf and ibuf */

"use strict";

import { equal, doesNotThrow, deepEqual } from "assert";
import { readFileSync } from 'fs';

import { Utils, isCompressed, decompress, isNIFTI1, isNIFTI, readHeader, readImage } from '../src/index';

var buf = readFileSync('./tests/data/air.hdr.gz');
var data = Utils.toArrayBuffer(buf);
var ibuf = readFileSync('./tests/data/air.img.gz');
var idata = Utils.toArrayBuffer(ibuf);

var nifti1 = null;
var bytes = null;
var clone = null;
describe('NIFTI-Reader-JS', function () {
    describe('uncompressed nifti-1 hdr/img pair test', function () {
        it('isCompressed() should return true', function () {
            equal(true, isCompressed(idata));
        });


        it('should not throw error when decompressing header', function (done) {
            doesNotThrow(function() {
                data = decompress(data);
                done();
            });
        });

        it('should not throw error when decompressing image', function (done) {
            doesNotThrow(function() {
                idata = decompress(idata);
                done();
            });
        });

        it('isNIFTI1() should return true', function () {
            equal(true, isNIFTI1(data, true));
        });

        it('isNIFTI() should return true', function () {
            equal(true, isNIFTI(data, true));
        });

        it('should not throw error when reading header', function (done) {
            doesNotThrow(function() {
                nifti1 = readHeader(data, true);
                done();
            });
        });

        it('dims[1] should be 79', function () {
            equal(79, nifti1.dims[1]);
        });

        it('dims[2] should be 67', function () {
            equal(67, nifti1.dims[2]);
        });

        it('dims[3] should be 64', function () {
            equal(64, nifti1.dims[3]);
        });

        it('image data checksum should equal 692149477', function () {
            var imageData = readImage(nifti1, idata);
            var checksum = Utils.crc32(new DataView(imageData));
            equal(checksum, 692149477);
        });

        it('data returned from toArrayBuffer preserves all nifti-1 properties', function() {
            nifti1 = readHeader(data, true);
            bytes = nifti1.toArrayBuffer();
            clone = readHeader(bytes, true);
            deepEqual(clone, nifti1);
        });

    });

});
