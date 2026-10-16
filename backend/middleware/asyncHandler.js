// Wraps an async route handler so a thrown/rejected error is forwarded to
// next(err) — i.e. to the centralized error handler — instead of needing a
// try/catch in every single controller function. Replaces the pattern:
//
//   export const getThing = async (req, res) => {
//     try { ... } catch (err) { res.status(500).json({...}) }
//   };
//
// with:
//
//   export const getThing = asyncHandler(async (req, res) => {
//     ...
//   });
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
