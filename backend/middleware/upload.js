import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: 'data', maxCount: 1 },
  { name: 'file', maxCount: 1 },
]);

const parseSignupForm = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Upload error.' });
    }
    next();
  });
};

// Course thumbnail + form fields (title, subtitle, description, category, etc.)
const courseUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([{ name: 'file', maxCount: 1 }]);

const parseCourseForm = (req, res, next) => {
  courseUpload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Upload error.' });
    }
    next();
  });
};

export { parseSignupForm, parseCourseForm };
