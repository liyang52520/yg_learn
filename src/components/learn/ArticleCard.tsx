import Link from "next/link";

export function ArticleCard({ article }: { article: any }) {
  return (
    <Link href={`/learn/articles/${article.id}`} className="block bg-card border rounded-lg p-4 hover:border-primary transition-colors">
      <h2 className="font-semibold">{article.title}</h2>
      {article.summary && <p className="text-sm text-muted-foreground mt-1">{article.summary}</p>}
      <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
        <span className="bg-muted px-2 py-0.5 rounded">{article.category.name}</span>
        <span>{new Date(article.createdAt).toLocaleDateString()}</span>
      </div>
    </Link>
  );
}
