import multer from "multer";

export const fileValidation = {
  image:['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/mpeg', 'video/quicktime'],
  document:['application/pdf', 'application/json']
}

export function cloudFileUpload({ validation = [] } = {}) {

  const storage = multer.diskStorage({});

  function fileFilter(req,file,callback){
    if(validation.includes(file.mimetype)){
      return callback(null, true)
    }

    return callback(new Error("Invalid file format"), false);
  }

  return multer({ fileFilter, storage });
}
