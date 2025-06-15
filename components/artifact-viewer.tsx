import { formatDistance } from "date-fns";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useDebounceCallback, useWindowSize } from "usehooks-ts";
import { useDocumentStore, type ClientDocument } from "@/lib/stores/document-store";
import { Toolbar } from "./toolbar";
import { VersionFooter } from "./version-footer";
import { ArtifactActions } from "./artifact-actions";
import { ArtifactCloseButton } from "./artifact-close-button";
import { useArtifact } from "@/lib/stores/document-store";
import { artifactDefinitions } from "@/artifacts";
import type { UseChatHelpers } from "@ai-sdk/react";

interface ArtifactViewerProps {
  status: UseChatHelpers["status"];
  stop: UseChatHelpers["stop"];
  setMessages: UseChatHelpers["setMessages"];
  append: UseChatHelpers["append"];
  width?: number;
}

export function ArtifactViewer({
  status,
  stop,
  setMessages,
  append,
  width,
}: ArtifactViewerProps) {
  const { artifact, setArtifact, metadata, setMetadata } = useArtifact();
  const {
    getDocument,
    updateDocument: updateDocumentInStore,
  } = useDocumentStore();

  // Use document store instead of SWR
  const [documents, setDocuments] = useState<Array<ClientDocument>>([]);
  const [isDocumentsFetching, setIsDocumentsFetching] = useState(false);

  useEffect(() => {
    if (artifact.documentId !== "init" && artifact.status !== "streaming") {
      const document = getDocument(artifact.documentId);
      if (document) {
        setDocuments([document]);
      }
    }
  }, [artifact.documentId, artifact.status, getDocument]);

  const [mode, setMode] = useState<"edit" | "diff">("edit");
  const [document, setDocument] = useState<ClientDocument | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

  useEffect(() => {
    if (documents && documents.length > 0) {
      const mostRecentDocument = documents.at(-1);

      if (mostRecentDocument) {
        setDocument(mostRecentDocument);
        setCurrentVersionIndex(documents.length - 1);
        setArtifact((currentArtifact) => ({
          ...currentArtifact,
          content: mostRecentDocument.content ?? "",
        }));
      }
    }
  }, [documents, setArtifact]);

  const [isContentDirty, setIsContentDirty] = useState(false);

  const handleContentChange = useCallback(
    (updatedContent: string) => {
      if (!artifact || !document) return;

      if (document.content !== updatedContent) {
        // Update document in local store
        updateDocumentInStore(artifact.documentId, {
          content: updatedContent,
          updatedAt: Date.now(),
        });

        setIsContentDirty(false);

        // Update local state
        const newDocument = {
          ...document,
          content: updatedContent,
          updatedAt: Date.now(),
        };
        setDocuments([newDocument]);
      }
    },
    [artifact, document, updateDocumentInStore]
  );

  const debouncedHandleContentChange = useDebounceCallback(
    handleContentChange,
    2000
  );

  const saveContent = useCallback(
    (updatedContent: string, debounce: boolean) => {
      if (document && updatedContent !== document.content) {
        setIsContentDirty(true);

        if (debounce) {
          debouncedHandleContentChange(updatedContent);
        } else {
          handleContentChange(updatedContent);
        }
      }
    },
    [document, debouncedHandleContentChange, handleContentChange]
  );

  function getDocumentContentById(index: number) {
    if (!documents) return "";
    if (!documents[index]) return "";
    return documents[index].content ?? "";
  }

  const handleVersionChange = (type: "next" | "prev" | "toggle" | "latest") => {
    if (!documents) return;

    if (type === "latest") {
      setCurrentVersionIndex(documents.length - 1);
      setMode("edit");
    }

    if (type === "toggle") {
      setMode((mode) => (mode === "edit" ? "diff" : "edit"));
    }

    if (type === "prev") {
      if (currentVersionIndex > 0) {
        setCurrentVersionIndex((index) => index - 1);
      }
    } else if (type === "next") {
      if (currentVersionIndex < documents.length - 1) {
        setCurrentVersionIndex((index) => index + 1);
      }
    }
  };

  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  /*
   * NOTE: if there are no documents, or if
   * the documents are being fetched, then
   * we mark it as the current version.
   */

  const isCurrentVersion =
    documents && documents.length > 0
      ? currentVersionIndex === documents.length - 1
      : true;

  const { height: windowHeight } = useWindowSize();

  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact.kind
  );

  if (!artifactDefinition) {
    throw new Error("Artifact definition not found!");
  }

  useEffect(() => {
    if (artifact.documentId !== "init") {
      if (artifactDefinition.initialize) {
        artifactDefinition.initialize({
          documentId: artifact.documentId,
          setMetadata,
        });
      }
    }
  }, [artifact.documentId, artifactDefinition, setMetadata]);

  if (!artifact.isVisible) {
    return null;
  }

  return (
    <div
      data-testid="artifact-viewer"
      className="dark:bg-muted bg-background h-dvh flex flex-col overflow-y-scroll md:border-r dark:border-zinc-700 border-zinc-200 transition-all duration-300 ease-in-out animate-fade-in"
      style={{ width: width || 'calc(100dvw - 400px)' }}
    >
      <div className="p-2 flex flex-row justify-between items-start">
        <div className="flex flex-row gap-4 items-start">
          <ArtifactCloseButton />

          <div className="flex flex-col">
            <div className="font-medium">{artifact.title}</div>

            {isContentDirty ? (
              <div className="text-sm text-muted-foreground">
                Saving changes...
              </div>
            ) : document ? (
              <div className="text-sm text-muted-foreground">
                {`Updated ${formatDistance(
                  new Date(document.updatedAt),
                  new Date(),
                  {
                    addSuffix: true,
                  }
                )}`}
              </div>
            ) : (
              <div className="w-32 h-3 mt-2 bg-muted-foreground/20 rounded-md animate-pulse" />
            )}
          </div>
        </div>

        <ArtifactActions
          artifact={artifact}
          currentVersionIndex={currentVersionIndex}
          handleVersionChange={handleVersionChange}
          isCurrentVersion={isCurrentVersion}
          mode={mode}
          metadata={metadata}
          setMetadata={setMetadata}
        />
      </div>

      <div className="dark:bg-muted bg-background h-full overflow-y-scroll !max-w-full items-center">
        <artifactDefinition.content
          title={artifact.title}
          content={
            isCurrentVersion
              ? artifact.content
              : getDocumentContentById(currentVersionIndex)
          }
          mode={mode}
          status={artifact.status === "streaming" ? "streaming" : "idle"}
          currentVersionIndex={currentVersionIndex}
          suggestions={[]}
          onSaveContent={saveContent}
          isInline={false}
          isCurrentVersion={isCurrentVersion}
          getDocumentContentById={getDocumentContentById}
          isLoading={isDocumentsFetching && !artifact.content}
          metadata={metadata}
          setMetadata={setMetadata}
        />

        {isCurrentVersion && (
          <Toolbar
            isToolbarVisible={isToolbarVisible}
            setIsToolbarVisible={setIsToolbarVisible}
            append={append}
            status={status}
            stop={stop}
            setMessages={setMessages}
            artifactKind={artifact.kind}
          />
        )}
      </div>

      {!isCurrentVersion && (
        <VersionFooter
          currentVersionIndex={currentVersionIndex}
          documents={documents}
          handleVersionChange={handleVersionChange}
        />
      )}
    </div>
  );
} 