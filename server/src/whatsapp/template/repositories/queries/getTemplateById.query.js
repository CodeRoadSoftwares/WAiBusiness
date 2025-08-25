import Template from "../../template.model.js";

export const getTemplateById = async (userId, templateId, session = null) => {
  try {
    let templateQuery;
    if (session) {
      templateQuery = Template.findOne({ userId, _id: templateId }).session(
        session
      );
    } else {
      templateQuery = Template.findOne({ _id: templateId });
    }

    const template = await templateQuery;
    return template;
  } catch (error) {
    throw new Error(`Failed to get template by id: ${error.message}`);
  }
};

export default getTemplateById;
