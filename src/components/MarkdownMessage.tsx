import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeHighlight from 'rehype-highlight'

interface MarkdownMessageProps {
  content: string
}

const components: Components = {
  table: ({ ...props }) => (
    <div className="badu-table-wrapper">
      <table {...props} />
    </div>
  ),
  code({ node, className, children, ...props }) {
    const language = className ? className.replace('language-', '') : undefined
    const inline = node?.position?.start.line === node?.position?.end.line
    if (inline) {
      return (
        <code className="badu-inline-code" {...props}>
          {children}
        </code>
      )
    }
    return (
      <pre className="badu-code-block" data-language={language}>
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    )
  },
  a: ({ ...props }) => (
    <a className="badu-link" target="_blank" rel="noreferrer" {...props} />
  ),
  ul: ({ ...props }) => (
    <ul className="badu-list badu-list-disc" {...props} />
  ),
  ol: ({ ...props }) => (
    <ol className="badu-list badu-list-decimal" {...props} />
  ),
  blockquote: ({ ...props }) => (
    <blockquote className="badu-blockquote" {...props} />
  ),
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="badu-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSlug, rehypeAutolinkHeadings, rehypeHighlight]}
        components={components}
      >
        {content.trim()}
      </ReactMarkdown>
    </div>
  )
}
