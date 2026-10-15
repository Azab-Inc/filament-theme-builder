export type PreviewFrameProps = {
  iframeSrc: string
  setIframe: (element: HTMLIFrameElement | null) => void
  onPreviewLoad: () => void
}
