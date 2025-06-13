"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useWindowSize } from "usehooks-ts";

import type { ClientDocument } from "@/lib/stores/document-store";
import { useDocumentStore } from "@/lib/stores/document-store";

import { LoaderIcon } from "./icons";
import { Button } from "./ui/button";
import { useArtifact } from "@/hooks/use-artifact";

interface VersionFooterProps {
  handleVersionChange: (type: "next" | "prev" | "toggle" | "latest") => void;
  documents: Array<ClientDocument> | undefined;
  currentVersionIndex: number;
}

export const VersionFooter = ({
  handleVersionChange,
  documents,
  currentVersionIndex,
}: VersionFooterProps) => {
  const { artifact } = useArtifact();
  const { deleteDocument, updateDocument } = useDocumentStore();

  const { width } = useWindowSize();
  const isMobile = width < 768;

  const [isMutating, setIsMutating] = useState(false);

  if (!documents) return;

  return (
    <motion.div
      className="absolute flex flex-col gap-4 lg:flex-row bottom-0 bg-background p-4 w-full border-t z-50 justify-between"
      initial={{ y: isMobile ? 200 : 77 }}
      animate={{ y: 0 }}
      exit={{ y: isMobile ? 200 : 77 }}
      transition={{ type: "spring", stiffness: 140, damping: 20 }}
    >
      <div>
        <div>You are viewing a previous version</div>
        <div className="text-muted-foreground text-sm">
          Restore this version to make edits
        </div>
      </div>

      <div className="flex flex-row gap-4">
        <Button
          disabled={isMutating}
          onClick={async () => {
            setIsMutating(true);

            try {
              // Get the current version's content
              const currentDocument = documents[currentVersionIndex];
              if (currentDocument) {
                // Update document to the selected version's content
                updateDocument(artifact.documentId, {
                  content: currentDocument.content,
                  updatedAt: Date.now(),
                });

                // Go back to latest version
                handleVersionChange("latest");
              }
            } catch (error) {
              console.error("Failed to restore version:", error);
            } finally {
              setIsMutating(false);
            }
          }}
        >
          <div>Restore this version</div>
          {isMutating && (
            <div className="animate-spin">
              <LoaderIcon />
            </div>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            handleVersionChange("latest");
          }}
        >
          Back to latest version
        </Button>
      </div>
    </motion.div>
  );
};
