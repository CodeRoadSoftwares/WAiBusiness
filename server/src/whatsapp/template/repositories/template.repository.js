import createTemplate from "./mutations/createTemplate.mutation.js";
import getTemplates from "./queries/getTemplates.query.js";
import getTemplateById from "./queries/getTemplateById.query.js";

export const TemplateRepository = {
  createTemplate,
  getTemplates,
  getTemplateById,
};
