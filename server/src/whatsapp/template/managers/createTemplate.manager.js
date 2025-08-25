import { TemplateRepository } from "../repositories/template.repository.js";
import { TransactionManager } from "../../../utils/transaction.util.js";

const createTemplateManager = async (userId, templateData) => {
  try {
    const template = await TransactionManager.executeTransaction(
      async (session) => {
        console.log("templateData:", templateData);
        console.log("userId:", userId);
        templateData.userId = userId;
        // Extract variables from text if present in {{}} and set to templateData.variables
        if (templateData.type === "text" || templateData.type === "mixed") {
          const variableMatches = templateData.text.match(/{{(.*?)}}/g);
          if (variableMatches) {
            // Remove the curly braces and trim whitespace
            templateData.variables = variableMatches.map((v) =>
              v.replace(/{{|}}/g, "").trim()
            );
          } else {
            templateData.variables = [];
          }
        }
        return await TemplateRepository.createTemplate(templateData, session);
      }
    );
    return template;
  } catch (error) {
    throw new Error(`Failed to create template: ${error.message}`);
  }
};

export default createTemplateManager;
