import { Note } from "@prisma/client";

export type TNote = {
  id: string;
  description: string;
  createdAt: string;
};

export const mapNoteFromPrisma = (note: Note): TNote => ({
  id: note.id,
  description: note.description,
  createdAt: note.createdAt.toISOString(),
});
