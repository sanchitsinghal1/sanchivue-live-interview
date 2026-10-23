// src/utils/pagination.js
// Reusable pagination helper that reads `page` and `limit` from the query string.
// Caps `limit` at 100 to prevent runaway queries.
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// getPagination(req) → { page, limit, skip }
export function getPagination(req) {
  let page = Number.parseInt(req?.query?.page, 10);
  let limit = Number.parseInt(req?.query?.limit, 10);
  if (!Number.isFinite(page) || page < 1) page = DEFAULT_PAGE;
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// Helper for mongoose-native pagination (Model.find + Model.countDocuments).
export async function paginateQuery(model, filter, options, populate = []) {
  const { page, limit, skip } = options;
  const [items, total] = await Promise.all([
    model.find(filter).skip(skip).limit(limit).populate(populate).lean(),
    model.countDocuments(filter),
  ]);
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 0,
  };
}

export default getPagination;
