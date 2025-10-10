import { addMedia, addManyMedia } from "./mutations/addMedia.mutation.js";
import { getMedia } from "./queries/getMedia.query.js";

export const MediaRepository = {
  addMedia,
  addManyMedia,
  getMedia,
};
