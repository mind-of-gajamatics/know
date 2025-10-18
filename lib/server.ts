'use server'

import fs from 'fs'
import path from 'path'

// fix: repository folder is `contents/posts` (plural)
const postsDirectory = path.join(process.cwd(), 'contents/posts')

export interface PostMetadata {
  slug: string
  title: string
  description: string
  date: string
  author: string
  tags: string[]
}

async function getMetadataFromFile(slug: string) {
 try {
    // Dynamically import the MDX file to get the metadata export
    const module = await import(`@/contents/posts/${slug}.mdx`)
    const metadata = module.metadata
    
    if (!metadata) {
      return null
    }

    return {
      slug,
      title: metadata.title,
      description: metadata.description,
      date: metadata.date,
      author: metadata.author,
      tags: metadata.tags || [],
    }
  } catch (error) {
    return null
  } 
}

export async function getAllPosts(): Promise<PostMetadata[]> {
  const fileNames = fs.readdirSync(postsDirectory)
  
  const allPostsPromises = fileNames
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map(async (fileName) => {
      const slug = fileName.replace(/\.mdx$/, '')
      return await getMetadataFromFile(slug)
    })

  const allPosts = (await Promise.all(allPostsPromises)).filter((post): post is PostMetadata => post !== null)

  // Sort posts by date (newest first)
  return allPosts.sort((a, b) => (a.date > b.date ? -1 : 1))
}

export async function getPostBySlug(slug: string) {
  const metadata = await getMetadataFromFile(slug)

  if (!metadata) {
    return null
  }

  try {
    const fullPath = path.join(postsDirectory, `${slug}.mdx`)
    const fileContents = fs.readFileSync(fullPath, 'utf-8')

    return {
      ...metadata,
      content: fileContents,
    }
  } catch (error){
    return null
  }
}

export async function getAllSlugs(): Promise<string[]> {
  const fileNames = fs.readdirSync(postsDirectory)
  return fileNames
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map((fileName) => fileName.replace(/\.mdx$/, ''))
}
