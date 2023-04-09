import { BaseNIFTI } from "./nifti-base.js";
import type { NiftiExtension } from "./nifti-extension.js";
import { ArrayMatrix3, ArrayMatrix4, Utils } from "./utilities.js";

export class NIFTI1 extends BaseNIFTI {
  // unit codes
  public static readonly SPATIAL_UNITS_MASK = 0x07;
  public static readonly TEMPORAL_UNITS_MASK = 0x38;
  public static readonly UNITS_UNKNOWN = 0;
  public static readonly UNITS_METER = 1;
  public static readonly UNITS_MM = 2;
  public static readonly UNITS_MICRON = 3;
  public static readonly UNITS_SEC = 8;
  public static readonly UNITS_MSEC = 16;
  public static readonly UNITS_USEC = 24;
  public static readonly UNITS_HZ = 32;
  public static readonly UNITS_PPM = 40;
  public static readonly UNITS_RADS = 48;

  // nifti1 codes
  public static readonly MAGIC_COOKIE = 348;
  public static readonly STANDARD_HEADER_SIZE = 348;
  public static readonly MAGIC_NUMBER_LOCATION = 344;
  public static readonly MAGIC_NUMBER = [0x6e, 0x2b, 0x31]; // n+1 (.nii)
  public static readonly MAGIC_NUMBER2 = [0x6e, 0x69, 0x31]; // ni1 (.hdr/.img)
  public static readonly EXTENSION_HEADER_SIZE = 8;

  private quatern_a?: number;

  private quatern_R?: ArrayMatrix3;

  private qfac?: number;

  constructor(
    protected littleEndian = false,
    private dim_info = 0,
    private dims: number[] = [],
    private intent_p1 = 0,
    private intent_p2 = 0,
    private intent_p3 = 0,
    private intent_code = 0,
    private datatypeCode = 0,
    private numBitsPerVoxel = 0,
    private slice_start = 0,
    private slice_end = 0,
    private slice_code = 0,
    private pixDims: number[] = [],
    private vox_offset = 0,
    private scl_slope = 1,
    private scl_inter = 0,
    private xyzt_units = 0,
    private cal_max = 0,
    private cal_min = 0,
    private slice_duration = 0,
    private toffset = 0,
    private description = "",
    private aux_file = "",
    private intent_name = "",
    private qform_code = 0,
    private sform_code = 0,
    private quatern_b = 0,
    private quatern_c = 0,
    private quatern_d = 0,
    private qoffset_x = 0,
    private qoffset_y = 0,
    private qoffset_z = 0,
    private affine: ArrayMatrix4 = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
    private magic: string | 0 = 0,
    private isHDR: boolean = false,
    public extensionFlag = [0, 0, 0, 0],
    private extensionSize = 0,
    private extensionCode = 0,
    private extensions: NiftiExtension[] = []
  ) {
    super();
  }

  /**
   * Reads the header data.
   */
  public readHeader(data: ArrayBuffer): void {
    var rawData = new DataView(data),
      magicCookieVal = Utils.getIntAt(rawData, 0, this.littleEndian),
      ctr,
      ctrOut,
      ctrIn,
      index;

    if (magicCookieVal !== NIFTI1.MAGIC_COOKIE) {
      // try as little endian
      this.littleEndian = true;
      magicCookieVal = Utils.getIntAt(rawData, 0, this.littleEndian);
    }

    if (magicCookieVal !== NIFTI1.MAGIC_COOKIE) {
      throw new Error("This does not appear to be a NIFTI file!");
    }

    this.dim_info = Utils.getByteAt(rawData, 39);

    for (ctr = 0; ctr < 8; ctr += 1) {
      index = 40 + ctr * 2;
      this.dims[ctr] = Utils.getShortAt(rawData, index, this.littleEndian);
    }

    this.intent_p1 = Utils.getFloatAt(rawData, 56, this.littleEndian);
    this.intent_p2 = Utils.getFloatAt(rawData, 60, this.littleEndian);
    this.intent_p3 = Utils.getFloatAt(rawData, 64, this.littleEndian);
    this.intent_code = Utils.getShortAt(rawData, 68, this.littleEndian);

    this.datatypeCode = Utils.getShortAt(rawData, 70, this.littleEndian);
    this.numBitsPerVoxel = Utils.getShortAt(rawData, 72, this.littleEndian);

    this.slice_start = Utils.getShortAt(rawData, 74, this.littleEndian);

    for (ctr = 0; ctr < 8; ctr += 1) {
      index = 76 + ctr * 4;
      this.pixDims[ctr] = Utils.getFloatAt(rawData, index, this.littleEndian);
    }

    this.vox_offset = Utils.getFloatAt(rawData, 108, this.littleEndian);

    this.scl_slope = Utils.getFloatAt(rawData, 112, this.littleEndian);
    this.scl_inter = Utils.getFloatAt(rawData, 116, this.littleEndian);

    this.slice_end = Utils.getShortAt(rawData, 120, this.littleEndian);
    this.slice_code = Utils.getByteAt(rawData, 122);

    this.xyzt_units = Utils.getByteAt(rawData, 123);

    this.cal_max = Utils.getFloatAt(rawData, 124, this.littleEndian);
    this.cal_min = Utils.getFloatAt(rawData, 128, this.littleEndian);

    this.slice_duration = Utils.getFloatAt(rawData, 132, this.littleEndian);
    this.toffset = Utils.getFloatAt(rawData, 136, this.littleEndian);

    this.description = Utils.getStringAt(rawData, 148, 228);
    this.aux_file = Utils.getStringAt(rawData, 228, 252);

    this.qform_code = Utils.getShortAt(rawData, 252, this.littleEndian);
    this.sform_code = Utils.getShortAt(rawData, 254, this.littleEndian);

    this.quatern_b = Utils.getFloatAt(rawData, 256, this.littleEndian);
    this.quatern_c = Utils.getFloatAt(rawData, 260, this.littleEndian);
    this.quatern_d = Utils.getFloatAt(rawData, 264, this.littleEndian);
    // Added by znshje on 27/11/2021
    //
    // quatern_a is a parameter in quaternion [a, b, c, d], which is required in affine calculation (METHOD 2)
    // mentioned in the nifti1.h file
    // It can be calculated by a = sqrt(1.0-(b*b+c*c+d*d))
    this.quatern_a = Math.sqrt(
      1.0 -
        (Math.pow(this.quatern_b, 2) +
          Math.pow(this.quatern_c, 2) +
          Math.pow(this.quatern_d, 2))
    );

    this.qoffset_x = Utils.getFloatAt(rawData, 268, this.littleEndian);
    this.qoffset_y = Utils.getFloatAt(rawData, 272, this.littleEndian);
    this.qoffset_z = Utils.getFloatAt(rawData, 276, this.littleEndian);

    // Added by znshje on 27/11/2021
    //
    /* See: https://nifti.nimh.nih.gov/pub/dist/src/niftilib/nifti1.h */
    if (this.qform_code > 0 && this.sform_code < this.qform_code) {
      //   METHOD 2 (used when qform_code > 0, which should be the "normal" case):
      //    ---------------------------------------------------------------------
      //    The (x,y,z) coordinates are given by the pixdim[] scales, a rotation
      //    matrix, and a shift.  This method is intended to represent
      //    "scanner-anatomical" coordinates, which are often embedded in the
      //    image header (e.g., DICOM fields (0020,0032), (0020,0037), (0028,0030),
      //    and (0018,0050)), and represent the nominal orientation and location of
      //    the data.  This method can also be used to represent "aligned"
      //    coordinates, which would typically result from some post-acquisition
      //    alignment of the volume to a standard orientation (e.g., the same
      //    subject on another day, or a rigid rotation to true anatomical
      //    orientation from the tilted position of the subject in the scanner).
      //    The formula for (x,y,z) in terms of header parameters and (i,j,k) is:
      //
      //      [ x ]   [ R11 R12 R13 ] [        pixdim[1] * i ]   [ qoffset_x ]
      //      [ y ] = [ R21 R22 R23 ] [        pixdim[2] * j ] + [ qoffset_y ]
      //      [ z ]   [ R31 R32 R33 ] [ qfac * pixdim[3] * k ]   [ qoffset_z ]
      //
      //    The qoffset_* shifts are in the NIFTI-1 header.  Note that the center
      //    of the (i,j,k)=(0,0,0) voxel (first value in the dataset array) is
      //    just (x,y,z)=(qoffset_x,qoffset_y,qoffset_z).
      //
      //    The rotation matrix R is calculated from the quatern_* parameters.
      //    This calculation is described below.
      //
      //    The scaling factor qfac is either 1 or -1.  The rotation matrix R
      //    defined by the quaternion parameters is "proper" (has determinant 1).
      //    This may not fit the needs of the data; for example, if the image
      //    grid is
      //      i increases from Left-to-Right
      //      j increases from Anterior-to-Posterior
      //      k increases from Inferior-to-Superior
      //    Then (i,j,k) is a left-handed triple.  In this example, if qfac=1,
      //    the R matrix would have to be
      //
      //      [  1   0   0 ]
      //      [  0  -1   0 ]  which is "improper" (determinant = -1).
      //      [  0   0   1 ]
      //
      //    If we set qfac=-1, then the R matrix would be
      //
      //      [  1   0   0 ]
      //      [  0  -1   0 ]  which is proper.
      //      [  0   0  -1 ]
      //
      //    This R matrix is represented by quaternion [a,b,c,d] = [0,1,0,0]
      //    (which encodes a 180 degree rotation about the x-axis).

      // Define a, b, c, d for coding covenience
      const a = this.quatern_a;
      const b = this.quatern_b;
      const c = this.quatern_c;
      const d = this.quatern_d;

      this.qfac = this.pixDims[0] === 0 ? 1 : this.pixDims[0];

      this.quatern_R = [
        [
          a * a + b * b - c * c - d * d,
          2 * b * c - 2 * a * d,
          2 * b * d + 2 * a * c,
        ],
        [
          2 * b * c + 2 * a * d,
          a * a + c * c - b * b - d * d,
          2 * c * d - 2 * a * b,
        ],
        [
          2 * b * d - 2 * a * c,
          2 * c * d + 2 * a * b,
          a * a + d * d - c * c - b * b,
        ],
      ];

      for (ctrOut = 0; ctrOut < 3; ctrOut += 1) {
        for (ctrIn = 0; ctrIn < 3; ctrIn += 1) {
          this.affine[ctrOut]![ctrIn] =
            this.quatern_R[ctrOut]![ctrIn]! * this.pixDims[ctrIn + 1]!;
          if (ctrIn === 2) {
            this.affine[ctrOut]![ctrIn] *= this.qfac!;
          }
        }
      }
      // The last row of affine matrix is the offset vector
      this.affine[0][3] = this.qoffset_x;
      this.affine[1][3] = this.qoffset_y;
      this.affine[2][3] = this.qoffset_z;
    } else if (this.sform_code > 0) {
      //    METHOD 3 (used when sform_code > 0):
      //    -----------------------------------
      //    The (x,y,z) coordinates are given by a general affine transformation
      //    of the (i,j,k) indexes:
      //
      //      x = srow_x[0] * i + srow_x[1] * j + srow_x[2] * k + srow_x[3]
      //      y = srow_y[0] * i + srow_y[1] * j + srow_y[2] * k + srow_y[3]
      //      z = srow_z[0] * i + srow_z[1] * j + srow_z[2] * k + srow_z[3]
      //
      //    The srow_* vectors are in the NIFTI_1 header.  Note that no use is
      //    made of pixdim[] in this method.
      for (ctrOut = 0; ctrOut < 3; ctrOut += 1) {
        for (ctrIn = 0; ctrIn < 4; ctrIn += 1) {
          index = 280 + (ctrOut * 4 + ctrIn) * 4;
          this.affine[ctrOut]![ctrIn] = Utils.getFloatAt(
            rawData,
            index,
            this.littleEndian
          );
        }
      }
    }

    this.affine[3][0] = 0;
    this.affine[3][1] = 0;
    this.affine[3][2] = 0;
    this.affine[3][3] = 1;

    this.intent_name = Utils.getStringAt(rawData, 328, 344);
    this.magic = Utils.getStringAt(rawData, 344, 348);

    // TODO: typescript is catching that this comparison will always be false
    this.isHDR = this.magic === NIFTI1.MAGIC_NUMBER2;

    if (rawData.byteLength > NIFTI1.MAGIC_COOKIE) {
      this.extensionFlag[0] = Utils.getByteAt(rawData, 348);
      this.extensionFlag[1] = Utils.getByteAt(rawData, 348 + 1);
      this.extensionFlag[2] = Utils.getByteAt(rawData, 348 + 2);
      this.extensionFlag[3] = Utils.getByteAt(rawData, 348 + 3);
      if (this.extensionFlag[0]) {
        // read our extensions
        this.extensions = Utils.getExtensionsAt(
          rawData,
          this.getExtensionLocation(),
          this.littleEndian,
          this.vox_offset
        );

        // set the extensionSize and extensionCode from the first extension found
        this.extensionSize = this.extensions[0]!.esize;
        this.extensionCode = this.extensions[0]!.ecode;
      }
    }
  }

  /**
   * Returns a formatted string of header fields.
   * @returns {string}
   */
  public toFormattedString(): string {
    const fmt = (num: number) => Utils.formatNumber(num, false);
    let string = "";

    string += "Dim Info = " + this.dim_info + "\n";

    string +=
      "Image Dimensions (1-8): " +
      this.dims[0] +
      ", " +
      this.dims[1] +
      ", " +
      this.dims[2] +
      ", " +
      this.dims[3] +
      ", " +
      this.dims[4] +
      ", " +
      this.dims[5] +
      ", " +
      this.dims[6] +
      ", " +
      this.dims[7] +
      "\n";

    string +=
      "Intent Parameters (1-3): " +
      this.intent_p1 +
      ", " +
      this.intent_p2 +
      ", " +
      this.intent_p3 +
      "\n";

    string += "Intent Code = " + this.intent_code + "\n";
    string +=
      "Datatype = " +
      this.datatypeCode +
      " (" +
      this.getDatatypeCodeString(this.datatypeCode) +
      ")\n";
    string += "Bits Per Voxel = " + this.numBitsPerVoxel + "\n";
    string += "Slice Start = " + this.slice_start + "\n";
    string +=
      "Voxel Dimensions (1-8): " +
      fmt(this.pixDims[0]!) +
      ", " +
      fmt(this.pixDims[1]!) +
      ", " +
      fmt(this.pixDims[2]!) +
      ", " +
      fmt(this.pixDims[3]!) +
      ", " +
      fmt(this.pixDims[4]!) +
      ", " +
      fmt(this.pixDims[5]!) +
      ", " +
      fmt(this.pixDims[6]!) +
      ", " +
      fmt(this.pixDims[7]!) +
      "\n";

    string += "Image Offset = " + this.vox_offset + "\n";
    string +=
      "Data Scale:  Slope = " +
      fmt(this.scl_slope) +
      "  Intercept = " +
      fmt(this.scl_inter) +
      "\n";
    string += "Slice End = " + this.slice_end + "\n";
    string += "Slice Code = " + this.slice_code + "\n";
    string +=
      "Units Code = " +
      this.xyzt_units +
      " (" +
      this.getUnitsCodeString(NIFTI1.SPATIAL_UNITS_MASK & this.xyzt_units) +
      ", " +
      this.getUnitsCodeString(NIFTI1.TEMPORAL_UNITS_MASK & this.xyzt_units) +
      ")\n";
    string +=
      "Display Range:  Max = " +
      fmt(this.cal_max) +
      "  Min = " +
      fmt(this.cal_min) +
      "\n";
    string += "Slice Duration = " + this.slice_duration + "\n";
    string += "Time Axis Shift = " + this.toffset + "\n";
    string += 'Description: "' + this.description + '"\n';
    string += 'Auxiliary File: "' + this.aux_file + '"\n';
    string +=
      "Q-Form Code = " +
      this.qform_code +
      " (" +
      this.getTransformCodeString(this.qform_code) +
      ")\n";
    string +=
      "S-Form Code = " +
      this.sform_code +
      " (" +
      this.getTransformCodeString(this.sform_code) +
      ")\n";
    string +=
      "Quaternion Parameters:  " +
      "b = " +
      fmt(this.quatern_b) +
      "  " +
      "c = " +
      fmt(this.quatern_c) +
      "  " +
      "d = " +
      fmt(this.quatern_d) +
      "\n";

    string +=
      "Quaternion Offsets:  " +
      "x = " +
      this.qoffset_x +
      "  " +
      "y = " +
      this.qoffset_y +
      "  " +
      "z = " +
      this.qoffset_z +
      "\n";

    string +=
      "S-Form Parameters X: " +
      fmt(this.affine[0][0]) +
      ", " +
      fmt(this.affine[0][1]) +
      ", " +
      fmt(this.affine[0][2]) +
      ", " +
      fmt(this.affine[0][3]) +
      "\n";

    string +=
      "S-Form Parameters Y: " +
      fmt(this.affine[1][0]) +
      ", " +
      fmt(this.affine[1][1]) +
      ", " +
      fmt(this.affine[1][2]) +
      ", " +
      fmt(this.affine[1][3]) +
      "\n";

    string +=
      "S-Form Parameters Z: " +
      fmt(this.affine[2][0]) +
      ", " +
      fmt(this.affine[2][1]) +
      ", " +
      fmt(this.affine[2][2]) +
      ", " +
      fmt(this.affine[2][3]) +
      "\n";

    string += 'Intent Name: "' + this.intent_name + '"\n';

    if (this.extensionFlag[0]) {
      string +=
        "Extension: Size = " +
        this.extensionSize +
        "  Code = " +
        this.extensionCode +
        "\n";
    }

    return string;
  }

  /**
   * Returns the byte index of the extension.
   * @returns {number}
   */
  protected getExtensionLocation(): number {
    return NIFTI1.MAGIC_COOKIE + 4;
  }

  /**
   * Returns header as ArrayBuffer.
   * @param {boolean} includeExtensions - should extension bytes be included
   * @returns {ArrayBuffer}
   */
  public toArrayBuffer(includeExtensions = false): ArrayBuffer {
    const SHORT_SIZE = 2;
    const FLOAT32_SIZE = 4;
    let byteSize = 348 + 4; // + 4 for the extension bytes

    // calculate necessary size
    if (includeExtensions) {
      for (let extension of this.extensions) {
        byteSize += extension.esize;
      }
    }
    let byteArray = new Uint8Array(byteSize);
    let view = new DataView(byteArray.buffer);
    // sizeof_hdr
    view.setInt32(0, 348, this.littleEndian);

    // data_type, db_name, extents, session_error, regular are not used

    // dim_info
    view.setUint8(39, this.dim_info);

    // dims
    for (let i = 0; i < 8; i++) {
      view.setUint16(40 + SHORT_SIZE * i, this.dims[i]!, this.littleEndian);
    }

    // intent_p1, intent_p2, intent_p3
    view.setFloat32(56, this.intent_p1, this.littleEndian);
    view.setFloat32(60, this.intent_p2, this.littleEndian);
    view.setFloat32(64, this.intent_p3, this.littleEndian);

    // intent_code, datatype, bitpix, slice_start
    view.setInt16(68, this.intent_code, this.littleEndian);
    view.setInt16(70, this.datatypeCode, this.littleEndian);
    view.setInt16(72, this.numBitsPerVoxel, this.littleEndian);
    view.setInt16(74, this.slice_start, this.littleEndian);

    // pixdim[8], vox_offset, scl_slope, scl_inter
    for (let i = 0; i < 8; i++) {
      view.setFloat32(
        76 + FLOAT32_SIZE * i,
        this.pixDims[i]!,
        this.littleEndian
      );
    }
    view.setFloat32(108, this.vox_offset, this.littleEndian);
    view.setFloat32(112, this.scl_slope, this.littleEndian);
    view.setFloat32(116, this.scl_inter, this.littleEndian);

    // slice_end
    view.setInt16(120, this.slice_end, this.littleEndian);

    // slice_code, xyzt_units
    view.setUint8(122, this.slice_code);
    view.setUint8(123, this.xyzt_units);

    // cal_max, cal_min, slice_duration, toffset
    view.setFloat32(124, this.cal_max, this.littleEndian);
    view.setFloat32(128, this.cal_min, this.littleEndian);
    view.setFloat32(132, this.slice_duration, this.littleEndian);
    view.setFloat32(136, this.toffset, this.littleEndian);

    // glmax, glmin are unused

    // descrip and aux_file
    byteArray.set(Buffer.from(this.description), 148);
    byteArray.set(Buffer.from(this.aux_file), 228);

    // qform_code, sform_code
    view.setInt16(252, this.qform_code, this.littleEndian);
    view.setInt16(254, this.sform_code, this.littleEndian);

    // quatern_b, quatern_c, quatern_d, qoffset_x, qoffset_y, qoffset_z, srow_x[4], srow_y[4], and srow_z[4]
    view.setFloat32(256, this.quatern_b, this.littleEndian);
    view.setFloat32(260, this.quatern_c, this.littleEndian);
    view.setFloat32(264, this.quatern_d, this.littleEndian);
    view.setFloat32(268, this.qoffset_x, this.littleEndian);
    view.setFloat32(272, this.qoffset_y, this.littleEndian);
    view.setFloat32(276, this.qoffset_z, this.littleEndian);
    const flattened = this.affine.flat();
    // we only want the first three rows
    for (let i = 0; i < 12; i++) {
      view.setFloat32(280 + FLOAT32_SIZE * i, flattened[i]!, this.littleEndian);
    }

    // intent_name and magic
    byteArray.set(Buffer.from(this.intent_name), 328);
    byteArray.set(Buffer.from(this.magic), 344);

    // add our extension data
    if (includeExtensions) {
      byteArray.set(Uint8Array.from([1, 0, 0, 0]), 348);
      let extensionByteIndex = this.getExtensionLocation();
      for (const extension of this.extensions) {
        view.setInt32(
          extensionByteIndex,
          extension.esize,
          extension.littleEndian
        );
        view.setInt32(
          extensionByteIndex + 4,
          extension.ecode,
          extension.littleEndian
        );
        byteArray.set(new Uint8Array(extension.edata), extensionByteIndex + 8);
        extensionByteIndex += extension.esize;
      }
    } else {
      // In a .nii file, these 4 bytes will always be present
      byteArray.set(new Uint8Array(4).fill(0), 348);
    }

    return byteArray.buffer;
  }
}
