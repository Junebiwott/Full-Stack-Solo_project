import multer from "multer";
export const singleUpload = multer().single("photo");
export const mutliUpload = multer().array("photos", 5);
//# sourceMappingURL=multer.js.map