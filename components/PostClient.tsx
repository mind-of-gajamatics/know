'use client'

import { useEffect, useState } from 'react'
import { PostMetadata } from '@/lib/server'
import { ComponentType } from 'react'

interface PostClientProps {
  metadata: PostMetadata
  slug: string
}

export default function PostClient({ metadata, slug }: PostClientProps) {
  const [MDXContent, setMDXContent] = useState<ComponentType | null>(null)

  useEffect(() => {
    async function loadMDX() {
      try {
        const mdxModule = await import(`@/contents/posts/${slug}.mdx`)
        setMDXContent(() => mdxModule.default)
      } catch (error) {
        console.error('Failed to load MDX:', error)
      }
    }
    loadMDX()
  }, [slug])

  if (!MDXContent) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading post content...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <article className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Header */}
          <header className="mb-8 pb-8 border-b-2 border-gray-200">
            <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {metadata.title}
            </h1>
            <p className="text-xl text-gray-600 mb-4">{metadata.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                📅 {new Date(metadata.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <span className="flex items-center gap-2">
                ✍️ {metadata.author}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {metadata.tags && metadata.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </header>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <MDXContent />
          </div>
        </article>
      </div>
    </div>
  )
}
