
/*jslint browser: true, node: true */
/*global require, module, describe, it */

"use strict";

import { equal } from "assert";
import { readFileSync } from 'fs';

import { Utils, isCompressed, isNIFTI, readHeader } from '../src/nifti.js';

var buf = readFileSync('./tests/data/not-nifti.nii');
var data = Utils.toArrayBuffer(buf);

describe('NIFTI-Reader-JS', function () {
    describe('not-nifti test', function () {
        it('isCompressed() should return false', function () {
            equal(false, isCompressed(data));
        });

        it('isNIFTI() should return false', function () {
            equal(false, isNIFTI(data));
        });

        it('readHeader() should return null', function () {
            equal(null, readHeader(data));
        });
    });
});
