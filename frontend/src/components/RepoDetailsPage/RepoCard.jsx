import React from "react";

const RepoCard = ({ repo }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        {repo.full_name}
      </h2>
      <div className="flex items-center gap-4 mb-4">
        <img
          src={repo.owner.avatar_url}
          alt={repo.owner.login}
          className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-600"
        />
        <div>
          <p className="font-medium text-gray-700 dark:text-gray-300">
            Owner: {repo.owner.login}
          </p>
          <a
            href={repo.owner.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline dark:text-blue-400"
          >
            View Profile
          </a>
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        <span className="font-medium">Description:</span>{" "}
        {repo.description || "No description provided."}
      </p>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        <span className="font-medium">Language:</span>{" "}
        {repo.language || "Not specified"}
      </p>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        <span className="font-medium">Visibility:</span> {repo.visibility}
      </p>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        <span className="font-medium">Stars:</span> {repo.stargazers_count}
      </p>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        <span className="font-medium">Forks:</span> {repo.forks_count}
      </p>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        <span className="font-medium">Open Issues:</span>{" "}
        {repo.open_issues_count}
      </p>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        <span className="font-medium">Created:</span>{" "}
        {new Date(repo.created_at).toLocaleDateString()}
      </p>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        <span className="font-medium">Last Updated:</span>{" "}
        {new Date(repo.updated_at).toLocaleDateString()}
      </p>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        <span className="font-medium">Last Pushed:</span>{" "}
        {new Date(repo.pushed_at).toLocaleDateString()}
      </p>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        <span className="font-medium">Clone URL:</span>{" "}
        <a
          href={repo.clone_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline dark:text-blue-400"
        >
          {repo.clone_url}
        </a>
      </p>
      {repo.homepage && (
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          <span className="font-medium">Homepage:</span>{" "}
          <a
            href={repo.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline dark:text-blue-400"
          >
            {repo.homepage}
          </a>
        </p>
      )}
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        <span className="font-medium">License:</span>{" "}
        {repo.license ? repo.license.name : "No license"}
      </p>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        <span className="font-medium">Size:</span> {repo.size} KB
      </p>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        <span className="font-medium">Default Branch:</span>{" "}
        {repo.default_branch}
      </p>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        <span className="font-medium">Fork:</span> {repo.fork ? "Yes" : "No"}
        {repo.fork && repo.parent && (
          <span>
            {" (Parent: "}
            <a
              href={repo.parent.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline dark:text-blue-400"
            >
              {repo.parent.full_name}
            </a>
            {")"}
          </span>
        )}
      </p>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        <span className="font-medium">Contributors:</span>{" "}
        {repo.contributors_count}
      </p>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        <span className="font-medium">Commits:</span> {repo.commit_count}
      </p>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        <span className="font-medium">Languages:</span>{" "}
        {repo.languages.length > 0 ? repo.languages.join(", ") : "None"}
      </p>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        <span className="font-medium">Permissions:</span>{" "}
        {Object.entries(repo.permissions || {})
          .filter(([_, value]) => value)
          .map(([key]) => key)
          .join(", ") || "None"}
      </p>
      {repo.topics.length > 0 && (
        <div className="mb-4">
          <span className="font-medium text-gray-600 dark:text-gray-400">
            Topics:
          </span>{" "}
          <div className="flex flex-wrap gap-2 mt-1">
            {repo.topics.map((topic, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full text-sm transition hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}
      <a
        href={repo.html_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition transform hover:scale-105"
      >
        View on GitHub
      </a>
    </div>
  );
};

export default RepoCard;
