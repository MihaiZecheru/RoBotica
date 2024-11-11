declare const __brand: unique symbol
type Brand<B> = { [__brand]: B };
type Branded<T, B> = T & Brand<B>;

// ----------------------------------------

type ID = Branded<`${string}-${string}-${string}-${string}`, "ID">;
export type UserID = Branded<ID, "UserID">;

export type ConversationID = Branded<ID, "ConversationID">;
export type MessageID = Branded<ID, "MessageID">;
export type StoryID = Branded<ID, "StoryID">;