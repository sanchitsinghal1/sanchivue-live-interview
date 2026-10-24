// src/middlewares/validate.middleware.js
// Wraps a Zod schema and runs it against req.body (or req.query / req.params).
// On failure, throws a 400 ApiError with the field-level issues so the client
// can show them inline.
import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// validate(schema, source='body') — returns an Express middleware.
// Source can be 'body', 'query', or 'params'.
export function validate(schema, source = 'body') {
  // Allow either a raw Zod schema or a factory returning one.
  const zodSchema = schema instanceof z.ZodType ? schema : schema(z);
  return asyncHandler(async (req, _res, next) => {
    const data = req[source] || {};
    const result = zodSchema.safeParse(data);
    if (!result.success) {
      // Map Zod issues to a compact { path, message }[] array.
      const errors = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      throw new ApiError(400, 'Validation failed.', errors);
    }
    // Replace the source with the parsed (and coerced/cleaned) value.
    req[source] = result.data;
    next();
  });
}

export default validate;
