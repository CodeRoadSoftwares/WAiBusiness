import { TemplateRepository } from "../repositories/template.repository.js";

const getTemplatesCountManager = async (userId) => {
  try {
    const templatesCount = await TemplateRepository.getTemplateCount(userId);
    return templatesCount;
  } catch (error) {
    console.error(`Failed to get templates count: ${error.message}`);
    throw new Error(`Failed to get templates count: ${error.message}`);
  }
};

export default getTemplatesCountManager;
