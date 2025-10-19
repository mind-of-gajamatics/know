import { notFound } from 'next/navigation'
import { getPostBySlug } from '@/lib/server-new'
import PostClient from '@/components/PostClient'

interface Props {
  params: Promise<{ 
    category: string
    slug: string 
  }>
}

export default async function PostPage({ params }: Props) {
  const { category, slug } = await params

  const post = await getPostBySlug(category, slug)

  if (!post) {
    notFound()
  }

  const metadata = {
    slug: post.slug,
    category: post.category,
    title: post.title,
    description: post.description,
    date: post.date,
    author: post.author,
    tags: post.tags,
  }

  return <PostClient metadata={metadata} category={category} slug={slug} />
}
