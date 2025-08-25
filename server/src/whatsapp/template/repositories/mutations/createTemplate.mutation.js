import Template from "../../template.model.js";

const createTemplate = async (templateData, session = null) => {
  try {
    if (session) {
      const template = await Template.create([templateData], { session });
      return template[0];
    } else {
      const template = await Template.create(templateData);
      return template;
    }
  } catch (error) {
    throw new Error(`Failed to create template: ${error.message}`);
  }
};

export default createTemplate;
