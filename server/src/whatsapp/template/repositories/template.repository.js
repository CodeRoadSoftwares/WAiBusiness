import createTemplate from "./mutations/createTemplate.mutation.js";
import getTemplates from "./queries/getTemplates.query.js";
import getTemplateById from "./queries/getTemplateById.query.js";
import { getTemplateCount } from "./queries/getTemplatesCount.query.js";

export const TemplateRepository = {
  createTemplate,
  getTemplates,
  getTemplateById,
  getTemplateCount,
};
