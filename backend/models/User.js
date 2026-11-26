import { JsonCollection } from "./jsonStore.js";

export const Users = new JsonCollection("users");

export const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  profile: u.profile || { branch: "", skills: [] },
});
