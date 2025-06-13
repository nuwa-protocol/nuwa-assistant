import { codeDocumentHandler } from "@/artifacts/code/server";
import { imageDocumentHandler } from "@/artifacts/image/server";
import { sheetDocumentHandler } from "@/artifacts/sheet/server";
import { textDocumentHandler } from "@/artifacts/text/server";
import type { ArtifactKind } from "@/components/artifact";
import type { DataStreamWriter } from "ai";

// Client document interface (replacing database Document)
export interface ClientDocument {
  id: string;
  title: string;
  content: string | null;
  kind: ArtifactKind;
  createdAt: number;
  updatedAt: number;
}

export interface SaveDocumentProps {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
}

export interface CreateDocumentCallbackProps {
  id: string;
  title: string;
  dataStream: DataStreamWriter;
}

export interface UpdateDocumentCallbackProps {
  document: ClientDocument;
  description: string;
  dataStream: DataStreamWriter;
}

export interface DocumentHandler<T = ArtifactKind> {
  kind: T;
  onCreateDocument: (args: CreateDocumentCallbackProps) => Promise<void>;
  onUpdateDocument: (args: UpdateDocumentCallbackProps) => Promise<void>;
}

export function createDocumentHandler<T extends ArtifactKind>(config: {
  kind: T;
  onCreateDocument: (params: CreateDocumentCallbackProps) => Promise<string>;
  onUpdateDocument: (params: UpdateDocumentCallbackProps) => Promise<string>;
}): DocumentHandler<T> {
  return {
    kind: config.kind,
    onCreateDocument: async (args: CreateDocumentCallbackProps) => {
      const draftContent = await config.onCreateDocument({
        id: args.id,
        title: args.title,
        dataStream: args.dataStream,
      });

      // send the complete content to the client for saving
      args.dataStream.writeData({
        type: "save-document",
        content: JSON.stringify({
          id: args.id,
          title: args.title,
          content: draftContent,
          kind: config.kind,
        }),
      });

      return;
    },
    onUpdateDocument: async (args: UpdateDocumentCallbackProps) => {
      const draftContent = await config.onUpdateDocument({
        document: args.document,
        description: args.description,
        dataStream: args.dataStream,
      });

      // send the updated content to the client for saving
      args.dataStream.writeData({
        type: "save-document",
        content: JSON.stringify({
          id: args.document.id,
          title: args.document.title,
          content: draftContent,
          kind: config.kind,
        }),
      });

      return;
    },
  };
}

/*
 * Use this array to define the document handlers for each artifact kind.
 */
export const documentHandlersByArtifactKind: Array<DocumentHandler> = [
  textDocumentHandler,
  codeDocumentHandler,
  imageDocumentHandler,
  sheetDocumentHandler,
];

export const artifactKinds = ["text", "code", "image", "sheet"] as const;
