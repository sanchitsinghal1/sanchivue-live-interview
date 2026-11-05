// src/utils/aggregationPagination.js
// Paginate an arbitrary aggregation pipeline. We use $facet so we get both the
// paged data AND the total count in a single round-trip.
// Returns { items, total, page, limit, totalPages }.
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from './pagination.js';

export async function aggregatePaginate(model, pipeline = [], options = {}) {
  let page = Number.parseInt(options.page, 10);
  let limit = Number.parseInt(options.limit, 10);
  if (!Number.isFinite(page) || page < 1) page = DEFAULT_PAGE;
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  const skip = (page - 1) * limit;

  // Always run the user-supplied pipeline as the "pre-stage" so $facet can
  // produce both the slice and the count.
  const facetStage = {
    $facet: {
      items: [{ $skip: skip }, { $limit: limit }],
      totalCount: [{ $count: 'count' }],
    },
  };

  const [result] = await model.aggregate([...pipeline, facetStage]);
  const items = result?.items || [];
  const total = result?.totalCount?.[0]?.count || 0;
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 0,
  };
}

export default aggregatePaginate;
