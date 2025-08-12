export function setFinalPath(req, res, next) {
  if (req.file && req._uploadBasePath && req._uploadedFileName) {
    req.file.finalPath = `${req._uploadBasePath}/${req._uploadedFileName}`;
    console.log("✅ finalPath set:", req.file.finalPath);
  } else {
    console.warn("⚠️ finalPath not set");
  }
  next();
}