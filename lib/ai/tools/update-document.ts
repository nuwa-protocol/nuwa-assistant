import { tool } from "ai";
import { z } from "zod";
import { useDocumentStore, updateGlobalArtifact } from "@/lib/stores/document-store";
import { updateTextContent } from "@/artifacts/text";
import { updateCodeContent } from "@/artifacts/code";
import { updateSheetContent } from "@/artifacts/sheet";
import { updateImageContent } from "@/artifacts/image";

// update function mapping
const updaters = {
  text: updateTextContent,
  code: updateCodeContent,
  sheet: updateSheetContent,
  image: updateImageContent,
};

export const updateDocument = () =>
  tool({
    description: "Update a document with the given description using AI.",
    parameters: z.object({
      id: z.string().describe("The ID of the document to update"),
      description: z
        .string()
        .describe("The description of changes that need to be made"),
    }),
    execute: async ({ id, description }) => {
      try {
        // Get document from client store
        const documentStore = useDocumentStore.getState();
        const document = documentStore.getDocument(id);

        if (!document) {
          return {
            error: "Document not found",
          };
        }

        // set artifact to streaming state
        updateGlobalArtifact((artifact) => ({
          ...artifact,
          documentId: id,
          title: document.title,
          kind: document.kind,
          content: document.content || "",
          status: "streaming",
          isVisible: true,
        }));

        // get the corresponding updater
        const updater = updaters[document.kind];
        if (!updater) {
          throw new Error(`No updater found for kind: ${document.kind}`);
        }

        let updatedContent = "";

        // call the AI update function, update artifact content in real time
        if (document.kind === "text") {
          updatedContent = await (updater as typeof updateTextContent)(
            document.content || "",
            description,
            (delta) => {
              updateGlobalArtifact((artifact) => ({
                ...artifact,
                content: artifact.content + delta,
                status: "streaming",
              }));
            }
          );
        } else if (document.kind === "code") {
          updatedContent = await (updater as typeof updateCodeContent)(
            document.content || "",
            description,
            (delta) => {
              updateGlobalArtifact((artifact) => ({
                ...artifact,
                content: delta,
                status: "streaming",
              }));
            }
          );
        } else if (document.kind === "sheet") {
          updatedContent = await (updater as typeof updateSheetContent)(
            document.content || "",
            description,
            (delta) => {
              updateGlobalArtifact((artifact) => ({
                ...artifact,
                content: delta,
                status: "streaming",
              }));
            }
          );
        } else if (document.kind === "image") {
          // image update does not need current content
          updatedContent = await (updater as typeof updateImageContent)(
            description,
            (imageBase64) => {
              updateGlobalArtifact((artifact) => ({
                ...artifact,
                content: imageBase64,
                status: "streaming",
              }));
            }
          );
        }

        // update document content and set artifact to idle state
        documentStore.setDocumentContent(id, updatedContent);

        updateGlobalArtifact((artifact) => ({
          ...artifact,
          content: updatedContent,
          status: "idle",
        }));

        return {
          id,
          title: document.title,
          kind: document.kind,
          content: updatedContent,
          message: `The ${document.kind} document "${document.title}" has been updated successfully.`,
        };
      } catch (error) {
        console.error("Failed to update document:", error);
        updateGlobalArtifact((artifact) => ({
          ...artifact,
          status: "idle",
        }));
        throw error;
      }
    },
  });
