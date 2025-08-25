import { TemplateRepository } from "../repositories/template.repository.js";

const getTemplatesManager = async (userId, query = {}) => {
  try {
    const result = await TemplateRepository.getTemplates(userId, query);
    return result;
  } catch (error) {
    throw new Error(`Failed to get templates: ${error.message}`);
  }
};

export default getTemplatesManager;
