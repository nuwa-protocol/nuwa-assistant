import { Artifact } from '@/components/create-artifact';
import { CopyIcon, RedoIcon, UndoIcon } from '@/components/icons';
import { ImageEditor } from '@/components/image-editor';
import { toast } from 'sonner';
import { myProvider } from '@/lib/ai/providers';
import { experimental_generateImage } from 'ai';
import { getLocaleText } from '@/locales/use-locale';
import { useSettingsStore } from '@/lib/stores/settings-store';

const language = useSettingsStore.getState().settings.language;
const { t } = getLocaleText(language);

// 客户端AI生成函数
async function generateImageContent(
  title: string,
  onComplete: (imageBase64: string) => void,
): Promise<string> {
  const { image } = await experimental_generateImage({
    model: myProvider.imageModel('small-model'),
    prompt: title,
    n: 1,
  });

  const base64Content = image.base64;
  onComplete(base64Content);
  return base64Content;
}

async function updateImageContent(
  description: string,
  onComplete: (imageBase64: string) => void,
): Promise<string> {
  const { image } = await experimental_generateImage({
    model: myProvider.imageModel('small-model'),
    prompt: description,
    n: 1,
  });

  const base64Content = image.base64;
  onComplete(base64Content);
  return base64Content;
}

export const imageArtifact = new Artifact({
  kind: 'image',
  description: t('artifact.image.description'),
  onStreamPart: ({ streamPart, setCurrentArtifact }) => {
    if (streamPart.type === 'image-delta') {
      setCurrentArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.content as string,
        isVisible: true,
        status: 'streaming',
      }));
    }
  },
  content: ImageEditor,
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: t('artifact.image.actions.undo'),
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
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
      description: t('artifact.image.actions.redo'),
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
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
      description: t('artifact.image.actions.copy'),
      onClick: ({ content }) => {
        const { t } = getLocaleText(language);
        const img = new Image();
        img.src = `data:image/png;base64,${content}`;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob }),
              ]);
            }
          }, 'image/png');
        };
        toast.success(t('artifact.image.copiedImage'));
      },
    },
  ],
  toolbar: [],
});

// 导出生成函数供外部使用
export { generateImageContent, updateImageContent };
