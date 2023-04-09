/*jslint browser: true, node: true */
/*global require, module, describe, it */

"use strict";

import { doesNotThrow, equal } from "assert";
import { readFileSync } from "fs";

import { Utils, readHeader, NIFTIEXTENSION } from "../src/nifti.js";

var buf = readFileSync("./tests/data/avg152T1_LR_nifti2.nii.gz");
var data = Utils.toArrayBuffer(buf);
var nifti2 = null;

describe("NIFTI-Reader-JS", function () {
  describe("nifti-2 extension test", function () {
    it("should not throw error when reading header", function (done) {
      doesNotThrow(function () {
        nifti2 = readHeader(data);
        done();
      });
    });

    it("extensions can be added and serialized", function () {
      let edata = new Int32Array(6);
      edata.fill(8);
      let newExtension = new NIFTIEXTENSION(32, 4, edata.buffer, true);
      nifti2.addExtension(newExtension);
      equal(1, nifti2.extensions.length);
      let bytes = nifti2.toArrayBuffer(true);
      let copy = readHeader(bytes);
      equal(1, copy.extensions.length);
      equal(4, copy.extensions[0].ecode);
      equal(24, copy.extensions[0].edata.byteLength);
    });
  });
});
