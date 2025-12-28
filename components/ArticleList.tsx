import React from 'react';
import { Trash2, FileText, Clock } from 'lucide-react';
import { Article } from '../types';

interface ArticleListProps {
  articles: Article[];
  onRemove: (id: string) => void;
}

export const ArticleList: React.FC<ArticleListProps> = ({ articles, onRemove }) => {
  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <FileText className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm font-medium">Nenhum artigo adicionado ainda.</p>
        <p className="text-xs">Cole o texto acima para começar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => (
        <div 
          key={article.id} 
          className="group relative flex items-start p-4 bg-white rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-indigo-100"
        >
          <div className="flex-shrink-0 mr-3 mt-1">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 mb-1 truncate pr-8">
              {article.title}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-2">
              {article.content}
            </p>
            <div className="flex items-center mt-2 text-[10px] text-slate-400">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(article.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <button
            onClick={() => onRemove(article.id)}
            className="absolute top-2 right-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Remover artigo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};