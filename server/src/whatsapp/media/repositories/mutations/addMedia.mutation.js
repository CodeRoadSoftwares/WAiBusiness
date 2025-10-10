import Media from "../../media.model.js";

export const addMedia = async (media, session = undefined) => {
  const newMedia = await Media.create([media], { session });
  return newMedia?.[0];
};

export const addManyMedia = async (mediaDocs, session = undefined) => {
  // Uses insertMany for performance and to respect the session
  const created = await Media.insertMany(mediaDocs, {
    session,
    ordered: false,
  });
  return created;
};
