import { notFound } from 'next/navigation'
import { getPostBySlug } from '@/lib/server'
import PostClient from '@/components/PostClient'

interface Props {
  params: { slug: string }
}

export default async function PostPage({ params }: Props) {
  const slug = params.slug

  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const metadata = {
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.date,
    author: post.author,
    tags: post.tags,
  }

  return <PostClient metadata={metadata} slug={slug} />
}