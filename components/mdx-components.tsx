import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Headings
    h1: ({ children }) => (
      <h1 className="text-5xl font-extrabold mb-8 mt-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-4xl font-bold mb-6 mt-10 text-gray-800 border-b-4 border-blue-500 pb-3">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-3xl font-semibold mb-4 mt-8 text-gray-700 flex items-center gap-2">
        <span className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-2xl font-semibold mb-3 mt-6 text-gray-700">
        {children}
      </h4>
    ),
    
    // Paragraphs and text
    p: ({ children }) => (
      <p className="text-lg text-gray-700 mb-6 leading-relaxed">
        {children}
      </p>
    ),
    
    // Links
    a: ({ href, children }) => (
      <a 
        href={href}
        className="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-2 hover:decoration-blue-800 transition-colors font-medium"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    
    // Lists
    ul: ({ children }) => (
      <ul className="list-none space-y-3 mb-6 ml-0">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside space-y-3 mb-6 ml-4 marker:text-blue-600 marker:font-bold">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="text-lg text-gray-700 flex items-start gap-3">
        <span className="inline-flex items-center justify-center w-2 h-2 mt-2.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0"></span>
        <span>{children}</span>
      </li>
    ),
    
    // Code blocks
    code: ({ children, className }) => {
      const isInline = !className
      
      if (isInline) {
        return (
          <code className="bg-gray-100 text-pink-600 px-2 py-1 rounded font-mono text-sm border border-gray-200">
            {children}
          </code>
        )
      }
      
      return (
        <code className={`${className} block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto font-mono text-sm`}>
          {children}
        </code>
      )
    },
    
    pre: ({ children }) => (
      <pre className="bg-gray-900 text-gray-100 p-6 rounded-xl overflow-x-auto mb-6 shadow-lg border-2 border-gray-700">
        {children}
      </pre>
    ),
    
    // Blockquotes
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-purple-500 bg-purple-50 pl-6 py-4 mb-6 italic text-gray-700 rounded-r-lg">
        {children}
      </blockquote>
    ),
    
    // Horizontal rule
    hr: () => (
      <hr className="my-12 border-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
    ),
    
    // Tables
    table: ({ children }) => (
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full border-collapse border border-gray-300 rounded-lg overflow-hidden shadow-lg">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        {children}
      </thead>
    ),
    th: ({ children }) => (
      <th className="border border-gray-300 px-6 py-3 text-left font-bold">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-gray-300 px-6 py-3 text-gray-700">
        {children}
      </td>
    ),
    tr: ({ children }) => (
      <tr className="hover:bg-gray-50 transition-colors">
        {children}
      </tr>
    ),
    
    // Strong and emphasis
    strong: ({ children }) => (
      <strong className="font-bold text-gray-900 bg-yellow-100 px-1 rounded">
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em className="italic text-purple-700 font-medium">
        {children}
      </em>
    ),
    
    ...components,
  }
}