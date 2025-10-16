import React from 'react';
import { useUser } from '../../hooks/useUser';
import './ArticleCard.css';

export const ArticleCard = ({ article, onRead }) => {
  const { user, canReadArticle, readArticle } = useUser();

  const handleRead = () => {
    if (readArticle(article.id)) {
      onRead?.(article.id);
    }
  };

  return (
    <div className="article-card">
      <div className="article-header">
        <h3 className="article-title">{article.title}</h3>
        <span className="article-date">
          {new Date(article.createdAt).toLocaleDateString()}
        </span>
      </div>
      
      <p className="article-excerpt">{article.excerpt}</p>
      
      <div className="article-footer">
        <span className="article-views">👁️ {article.views} wyświetleń</span>
        
        {user && (
          <button 
            className={`read-button ${!canReadArticle(article.id) ? 'read' : ''}`}
            onClick={handleRead}
            disabled={!canReadArticle(article.id)}
          >
            {canReadArticle(article.id) ? '📖 Przeczytaj (+10 pkt)' : '✅ Przeczytane'}
          </button>
        )}
      </div>
    </div>
  );
};