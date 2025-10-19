'use server'

import fs from 'fs'
import path from 'path'

const contentsDirectory = path.join(process.cwd(), 'contents')

export interface PostMetadata {
  slug: string
  category: string
  title: string
  description: string
  date: string
  author: string
  tags: string[]
}

async function getMetadataFromFile(category: string, slug: string): Promise<PostMetadata | null> {
  try {
    // Dynamically import the MDX file to get the metadata export
    const mdxModule = await import(`@/contents/${category}/${slug}.mdx`)
    const metadata = mdxModule.metadata
    
    if (!metadata) {
      return null
    }

    return {
      slug,
      category,
      title: metadata.title,
      description: metadata.description,
      date: metadata.date,
      author: metadata.author,
      tags: metadata.tags || [],
    }
  } catch {
    return null
  } 
}

// Get all categories (folders in contents directory)
export async function getAllCategories(): Promise<string[]> {
  const entries = fs.readdirSync(contentsDirectory, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
}

// Get all posts from all categories
export async function getAllPosts(): Promise<PostMetadata[]> {
  const categories = await getAllCategories()
  const allPostsPromises: Promise<PostMetadata | null>[] = []

  for (const category of categories) {
    const categoryPath = path.join(contentsDirectory, category)
    const fileNames = fs.readdirSync(categoryPath)
    
    const categoryPosts = fileNames
      .filter((fileName) => fileName.endsWith('.mdx'))
      .map(async (fileName) => {
        const slug = fileName.replace(/\.mdx$/, '')
        return await getMetadataFromFile(category, slug)
      })
    
    allPostsPromises.push(...categoryPosts)
  }

  const allPosts = (await Promise.all(allPostsPromises)).filter((post): post is PostMetadata => post !== null)

  // Sort posts by date (newest first)
  return allPosts.sort((a, b) => (a.date > b.date ? -1 : 1))
}

// Get posts by category
export async function getPostsByCategory(category: string): Promise<PostMetadata[]> {
  const categoryPath = path.join(contentsDirectory, category)
  
  if (!fs.existsSync(categoryPath)) {
    return []
  }

  const fileNames = fs.readdirSync(categoryPath)
  
  const allPostsPromises = fileNames
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map(async (fileName) => {
      const slug = fileName.replace(/\.mdx$/, '')
      return await getMetadataFromFile(category, slug)
    })

  const posts = (await Promise.all(allPostsPromises)).filter((post): post is PostMetadata => post !== null)

  // Sort posts by date (newest first)
  return posts.sort((a, b) => (a.date > b.date ? -1 : 1))
}

// Get a single post by category and slug
export async function getPostBySlug(category: string, slug: string) {
  const metadata = await getMetadataFromFile(category, slug)

  if (!metadata) {
    return null
  }

  try {
    const fullPath = path.join(contentsDirectory, category, `${slug}.mdx`)
    const fileContents = fs.readFileSync(fullPath, 'utf-8')

    return {
      ...metadata,
      content: fileContents,
    }
  } catch {
    return null
  }
}

// Get all slugs for a specific category
export async function getSlugsByCategory(category: string): Promise<string[]> {
  const categoryPath = path.join(contentsDirectory, category)
  
  if (!fs.existsSync(categoryPath)) {
    return []
  }

  const fileNames = fs.readdirSync(categoryPath)
  return fileNames
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map((fileName) => fileName.replace(/\.mdx$/, ''))
}

// Get all category/slug combinations for static generation
export async function getAllPostPaths(): Promise<{ category: string; slug: string }[]> {
  const categories = await getAllCategories()
  const paths: { category: string; slug: string }[] = []

  for (const category of categories) {
    const slugs = await getSlugsByCategory(category)
    paths.push(...slugs.map((slug) => ({ category, slug })))
  }

  return paths
}
