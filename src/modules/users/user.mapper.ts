import type {
  UserDocument,
  PublicUser,
  PublicAuthorBrief,
  PublicUserForSearch,
} from "@modules/users/user.types";

export function toPublicUser(doc: UserDocument): PublicUser {
  return {
    id: doc.id,
    email: doc.email,
    role: doc.role,
    username: doc.username,
    displayName: doc.displayName,
    avatarUrl: doc.avatarUrl,
  };
}

export function toAuthorBrief(doc: UserDocument): PublicAuthorBrief {
  return {
    id: doc.id,
    username: doc.username,
    displayName: doc.displayName,
    avatarUrl: doc.avatarUrl,
  };
}

export function toPublicUserForSearch(doc: UserDocument): PublicUserForSearch {
  return {
    id: doc.id,
    username: doc.username,
    displayName: doc.displayName,
    avatarUrl: doc.avatarUrl,
  };
}
