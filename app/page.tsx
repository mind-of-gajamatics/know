import { getAllPosts, getAllCategories } from '@/lib/server-new'
import Link from 'next/link'

export default async function Home() {
  const allPosts = await getAllPosts()
  const categories = await getAllCategories()
  
  // Group posts by category
  const postsByCategory = categories.reduce((acc, category) => {
    acc[category] = allPosts.filter(post => post.category === category)
    return acc
  }, {} as Record<string, typeof allPosts>)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Know
          </h1>
          <p className="text-xl text-gray-600">
            Explore knowledge organized by category
          </p>
        </header>

        {categories.map((category) => (
          <section key={category} className="mb-12">
            <h2 className="text-3xl font-bold mb-6 capitalize text-gray-800 border-b-4 border-blue-500 pb-3 inline-block">
              {category}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {postsByCategory[category]?.map((post) => (
                <Link
                  key={`${post.category}-${post.slug}`}
                  href={`/posts/${post.category}/${post.slug}`}
                  className="group"
                >
                  <article className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 h-full border-2 border-transparent group-hover:border-blue-500">
                    <h3 className="text-2xl font-bold mb-3 text-gray-800 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span>📅 {new Date(post.date).toLocaleDateString()}</span>
                      <span>✍️ {post.author}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {allPosts.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <p className="text-xl">No posts yet. Start creating content!</p>
          </div>
        )}
      </div>
    </div>
  )
}
