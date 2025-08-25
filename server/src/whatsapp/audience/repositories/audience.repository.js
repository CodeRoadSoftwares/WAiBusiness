import { createAudience } from "./mutations/createAudience.mutation.js";
import { getAudience } from "./queries/getAudience.query.js";
import { getAudienceById } from "./queries/getAudienceById.query.js";

export const AudienceRepository = {
  createAudience,
  getAudience,
  getAudienceById,
};
