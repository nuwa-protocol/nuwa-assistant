import { Artifact } from "@/components/create-artifact";
import { DiffView } from "@/components/diffview";
import { DocumentSkeleton } from "@/components/document-skeleton";
import { Editor } from "@/components/text-editor";
import {
  ClockRewind,
  CopyIcon,
  MessageIcon,
  PenIcon,
  RedoIcon,
  UndoIcon,
} from "@/components/icons";
import type { ClientSuggestion } from "@/lib/stores/document-store";
import { smoothStream, streamText } from "ai";
import { myProvider } from "@/lib/ai/providers";
import { updateDocumentPrompt } from "@/lib/ai/prompts";
import { toast } from "sonner";
import { useDocumentStore } from "@/lib/stores/document-store";
import { getLocaleText } from '@/locales/use-locale';
import { useSettingsStore } from '@/lib/stores/settings-store';

interface TextArtifactMetadata {
  suggestions: Array<ClientSuggestion>;
}

async function generateTextContent(
  title: string,
  onDelta: (delta: string) => void
): Promise<string> {
  let draftContent = "";

  const { fullStream } = streamText({
    model: myProvider.languageModel("artifact-model"),
    system:
      "Write about the given topic. Markdown is supported. Use headings wherever appropriate.",
    experimental_transform: smoothStream({ chunking: "word" }),
    prompt: title,
  });

  for await (const delta of fullStream) {
    if (delta.type === "text-delta") {
      const { textDelta } = delta;
      draftContent += textDelta;
      onDelta(textDelta);
    }
  }

  return draftContent;
}

async function updateTextContent(
  currentContent: string,
  description: string,
  onDelta: (delta: string) => void
): Promise<string> {
  let draftContent = "";

  const { fullStream } = streamText({
    model: myProvider.languageModel("artifact-model"),
    system: updateDocumentPrompt(currentContent, "text"),
    experimental_transform: smoothStream({ chunking: "word" }),
    prompt: description,
    experimental_providerMetadata: {
      openai: {
        prediction: {
          type: "content",
          content: currentContent,
        },
      },
    },
  });

  for await (const delta of fullStream) {
    if (delta.type === "text-delta") {
      const { textDelta } = delta;
      draftContent += textDelta;
      onDelta(textDelta);
    }
  }

  return draftContent;
}

const language = useSettingsStore.getState().settings.language || "en";
const { t } = getLocaleText(language);

export const textArtifact = new Artifact<"text", TextArtifactMetadata>({
  kind: "text",
  description: t('artifact.text.description'),
  initialize: async ({ documentId, setMetadata }) => {
    const { getSuggestionsByDocument } = useDocumentStore.getState();
    const suggestions = getSuggestionsByDocument(documentId);
    setMetadata({ suggestions });
  },
  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
    if (streamPart.type === "text-delta") {
      setArtifact((draftArtifact) => {
        return {
          ...draftArtifact,
          content: draftArtifact.content + (streamPart.content as string),
          isVisible:
            draftArtifact.status === "streaming" &&
            draftArtifact.content.length > 400 &&
            draftArtifact.content.length < 450
              ? true
              : draftArtifact.isVisible,
          status: "streaming",
        };
      });
    }
  },
  content: (props) => {
    const { mode, status, content, isCurrentVersion, currentVersionIndex, onSaveContent, getDocumentContentById, isLoading, metadata } = props;
    if (isLoading) {
      return <DocumentSkeleton artifactKind="text" />;
    }
    if (mode === "diff") {
      const oldContent = getDocumentContentById(currentVersionIndex - 1);
      const newContent = getDocumentContentById(currentVersionIndex);
      return <DiffView oldContent={oldContent} newContent={newContent} />;
    }
    return (
      <>
        <div className="flex flex-row py-8 md:p-20 px-4">
          <Editor
            content={content}
            suggestions={metadata ? metadata.suggestions : []}
            isCurrentVersion={isCurrentVersion}
            currentVersionIndex={currentVersionIndex}
            status={status}
            onSaveContent={onSaveContent}
          />
          {metadata?.suggestions && metadata.suggestions.length > 0 ? (
            <div className="md:hidden h-dvh w-12 shrink-0" />
          ) : null}
        </div>
      </>
    );
  },
  actions: [
    {
      icon: <ClockRewind size={18} />,
      description: t('artifact.text.actions.versionChange'),
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("toggle");
      },
      isDisabled: ({ currentVersionIndex, setMetadata }) => {
        if (currentVersionIndex === 0) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <UndoIcon size={18} />,
      description: t('artifact.text.actions.undo'),
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("prev");
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: t('artifact.text.actions.redo'),
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("next");
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: t('artifact.text.actions.copy'),
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success(t('artifact.copied'));
      },
    },
  ],
  toolbar: [
    {
      icon: <PenIcon />,
      description: t('artifact.text.toolbar.polish'),
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: "user",
          content: t('artifact.text.polishPrompt'),
        });
      },
    },
    {
      icon: <MessageIcon />,
      description: t('artifact.text.toolbar.suggestions'),
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: "user",
          content: t('artifact.text.suggestionsPrompt'),
        });
      },
    },
  ],
});

export { generateTextContent, updateTextContent };
