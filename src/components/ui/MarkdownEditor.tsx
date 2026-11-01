'use client'

import type { MDEditorProps } from '@uiw/react-md-editor'
import dynamic from 'next/dynamic'

/*
  The editor package is large and only needed once someone starts editing. Any
  non-type import from it (even just `commands`) puts the whole package in the
  page bundle, so the toolbar is resolved here, after the package has loaded.
*/
const MarkdownEditor = dynamic<MDEditorProps>(
  () => import('@uiw/react-md-editor').then(({ default: MDEditor, commands }) => {
    const toolbar = [
      commands.bold,
      commands.italic,
      commands.hr,
      commands.divider,
      commands.quote,
      commands.unorderedListCommand,
      commands.orderedListCommand,
    ]

    return function MarkdownEditorLoaded(props: MDEditorProps) {
      return <MDEditor preview="edit" data-color-mode="dark" commands={toolbar} {...props} />
    }
  }),
  {
    ssr: false,
    loading: () => <div style={{ minHeight: 300 }} />,
  }
)

export default MarkdownEditor
