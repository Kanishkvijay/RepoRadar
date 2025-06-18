import React from 'react';
import './ResultDisplay.css';

function ResultDisplay({ results, onBack }) {
  const {
    originality_score,
    verdict,
    idea_summary,
    copied_blocks,
    similar_projects,
    report_url,
  } = results || {};

  const handleDownload = () => {
    if (report_url) {
      window.location.href = report_url;
    }
  };

  // Function to determine score color
  const getScoreColor = (score) => {
    if (score > 80) return '#10B981'; // Green
    if (score > 60) return '#FBBF24'; // Yellow
    return '#EF4444'; // Red
  };

  // Calculate similarity color
  const getSimilarityColor = (similarity) => {
    const simPercent = similarity * 100;
    if (simPercent < 30) return { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669' }; // Green
    if (simPercent < 60) return { bg: 'rgba(251, 191, 36, 0.1)', text: '#D97706' }; // Yellow
    return { bg: 'rgba(239, 68, 68, 0.1)', text: '#DC2626' }; // Red
  };

  const scoreColor = originality_score ? getScoreColor(originality_score) : '#10B981';

  return (
    <div className="bento-container animate-fade-in">
      {results ? (
        <>
          {/* Originality Score */}
          <div className="bento-score glass-container bento-item">
            <h2 className="bento-title">Originality Score</h2>
            <div className="score-circle-container">
              <div 
                className="score-circle" 
                style={{
                  background: `conic-gradient(
                    ${scoreColor} ${originality_score}%,
                    #E5E7EB ${originality_score}%
                  )`
                }}
              >
                <div className="score-text">{originality_score?.toFixed(1)}%</div>
              </div>
              <div className="score-label">
                {originality_score > 80 ? "Highly Original" : 
                 originality_score > 60 ? "Moderately Original" : "Low Originality"}
              </div>
            </div>
          </div>

          {/* Verdict */}
          <div className="bento-verdict glass-container bento-item">
            <h2 className="bento-title">Verdict</h2>
            <div className="content-text">{verdict}</div>
          </div>

          {/* Idea Summary */}
          <div className="bento-summary glass-container bento-item">
            <h2 className="bento-title">Idea Summary</h2>
            <div className="content-text">{idea_summary}</div>
          </div>

          {/* Copied Blocks */}
          <div className="bento-copied glass-container bento-item">
            <h2 className="bento-title">Copied Blocks</h2>
            {copied_blocks && copied_blocks.length > 0 ? (
              <div className="code-blocks-container">
                {copied_blocks.map((block, index) => {
                  const similarityStyle = getSimilarityColor(block.distance);
                  return (
                    <div key={index} className="code-block">
                      <div className="code-content">
                        {block.target_block}
                      </div>
                      <div className="code-meta">
                        <span>Similar to: {block.similar_to}</span>
                        <span 
                          className="similarity-tag" 
                          style={{ 
                            backgroundColor: similarityStyle.bg, 
                            color: similarityStyle.text 
                          }}
                        >
                          Similarity: {(block.distance * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="content-text">No copied blocks detected.</div>
            )}
          </div>

          {/* Similar Projects */}
          <div className="bento-projects glass-container bento-item">
            <h2 className="bento-title">Similar Projects</h2>
            {similar_projects && similar_projects.length > 0 ? (
              <ul className="projects-list">
                {similar_projects.map((project, index) => (
                  <li key={index} className="project-item">{project}</li>
                ))}
              </ul>
            ) : (
              <div className="content-text">No similar projects found.</div>
            )}
          </div>

          {/* Download Button */}
          <button 
            className="bento-download glass-container download-button"
            onClick={handleDownload}
            title="Download full report"
          >
            <div className="download-icon">↓</div>
            <div className="download-text">Download Report</div>
          </button>
        </>
      ) : (
        <div className="glass-container bento-item" style={{ gridColumn: '1 / span 3' }}>
          <div className="content-text">No results available. Please analyze a repository.</div>
        </div>
      )}
    </div>
  );
}

export default ResultDisplay;