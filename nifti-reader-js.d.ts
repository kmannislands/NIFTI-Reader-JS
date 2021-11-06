// Type definitions for nifti-reader-js v0.5.4
// Project: rii-mango
// Definitions by: Kieran Mann <https://github.com/kmannislands>

declare module 'nifti-reader-js' {
    export const isCompressed: (ArrayBuffer: ArrayBuffer) => boolean;

    /**
     * Decompress the nifti arraybuffer. Uses pako underneath the hood.
     */
    export const decompress: (ArrayBuffer: ArrayBuffer) => ArrayBuffer;

    /**
     * Magic string-base4d check. Works on compressed or uncompressed.
     */
    export const isNIFTI: (ArrayBuffer: ArrayBuffer) => boolean;

    export const readHeader: (ArrayBuffer: ArrayBuffer) => NIFTI1;

    export const readImage: (niftiHeader: NIFTI1, ArrayBuffer: ArrayBuffer) => ArrayBuffer;

    /**
     * Meta information included in the nii file that tells you things like:
     *   - What sort of data to expect for voxel values
     *   - Overall dimensions of the image
     *   - How to transform back to scanner space or potentially another space
     *
     * @see https://nifti.nimh.nih.gov/pub/dist/src/niftilib/nifti1.h
     * @see https://brainder.org/2012/09/23/the-nifti-file-format/
     */
    class NIFTI1 {
        /**
         * Helpful bit masks for decoding nifti XYZT units
         */
        static TEMPORAL_UNITS_MASK: number;

        static SPATIAL_UNITS_MASK: number;

        /**
         * NIFTI type indicator bytes
         */
        static TYPE_BINARY: number;

        static TYPE_COMPLEX64: number;

        static TYPE_COMPLEX128: number;

        static TYPE_COMPLEX256: number;

        static TYPE_FLOAT128: number;

        static TYPE_INT64: number;

        static TYPE_NONE: number;

        static TYPE_UINT64: number;

        static TYPE_FLOAT32: number;

        static TYPE_FLOAT64: number;

        static TYPE_INT8: number;

        static TYPE_INT16: number;

        static TYPE_INT32: number;

        static TYPE_UINT8: number;

        static TYPE_UINT16: number;

        static TYPE_UINT32: number;

        static TYPE_RGB24: number;

        public readonly littleEndian: boolean;

        public readonly dim_info: number;

        public readonly dims: [number, number, number, number, number, number, number, number];

        public readonly intent_p1: number;

        public readonly intent_p2: number;

        public readonly intent_p3: number;

        public readonly intent_code: number;

        public readonly datatypeCode: number;

        public readonly numBitsPerVoxel: number;

        public readonly slice_start: number;

        public readonly slice_end: number;

        public readonly slice_code: number;

        public readonly pixDims: [number, number, number, number, number, number, number, number];

        public readonly vox_offset: number;

        public readonly scl_slope: number;

        public readonly scl_inter: number;

        public readonly xyzt_units: number;

        public readonly cal_max: number;

        public readonly cal_min: number;

        public readonly slice_duration: number;

        public readonly toffset: number;

        public readonly description: string;

        public readonly aux_file: string;

        public readonly intent_name: string;

        public readonly qform_code: number;

        public readonly sform_code: number;

        public readonly quatern_b: number;

        public readonly quatern_c: number;

        public readonly quatern_d: number;

        public readonly qoffset_x: number;

        public readonly qoffset_y: number;

        public readonly qoffset_z: number;

        public readonly affine: [
            [number, number, number, number],
            [number, number, number, number],
            [number, number, number, number],
            [number, number, number, number]
        ];

        public readonly magic: number;

        public readonly isHDR: boolean;

        public readonly extensionFlag: [number, number, number, number];

        public readonly extensionSize: number;

        public readonly extensionCode: number;

        /**
         * Interpret masked bytes as a unit string
         * @param bytes
         */
        public getUnitsCodeString(bytes: number): string;

        public getDatatypeCodeString: (dataTypeCode: number) => string;
    }

    export type NiftiHeader = NIFTI1;
}
