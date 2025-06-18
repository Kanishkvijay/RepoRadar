import { useState, useEffect } from "react";

const RepoFinder = () => {
  const [query, setQuery] = useState("");
  const [repos, setRepos] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("stars");
  const [languageFilter, setLanguageFilter] = useState("");
  const [languages, setLanguages] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const perPage = 6;

  const fetchRepos = async (resetPage = false) => {
    setError("");
    setLoading(true);

    try {
      const currentPage = resetPage ? 1 : page;

      // Using fetch instead of axios for simplicity
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(
          query
        )}+in:name${
          languageFilter ? `+language:${languageFilter}` : ""
        }&sort=${sort}&page=${currentPage}&per_page=${perPage}`
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      // Transform data for display
      const repoData = data.items.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description || "No description provided",
        owner: {
          login: repo.owner.login,
          avatarUrl: repo.owner.avatar_url,
          url: repo.owner.html_url,
        },
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        issues: repo.open_issues_count,
        language: repo.language || "Not specified",
        url: repo.html_url,
        created: new Date(repo.created_at).toLocaleDateString(),
        updated: new Date(repo.updated_at).toLocaleDateString(),
        topics: repo.topics || [],
      }));

      setRepos(repoData);

      // Extract unique languages for filter
      const allLanguages = new Set(
        repoData.map((repo) => repo.language).filter(Boolean)
      );
      setLanguages([...allLanguages]);

      if (resetPage) setPage(1);
    } catch (err) {
      setError(`Failed to fetch repositories: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError("Please enter a repository name");
      return;
    }
    fetchRepos(true);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  useEffect(() => {
    if (query.trim()) {
      fetchRepos();
    }
  }, [page, sort, languageFilter]);

  return (
    <div
      className={
        darkMode
          ? "bg-gray-900 text-white"
          : "bg-gradient-to-br from-blue-500 to-purple-600"
      }
    >
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">
            GitHub Repository Finder
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for repositories..."
                className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition transform hover:scale-105"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="mb-4 sm:mb-0">
              <label className="mr-2 font-medium">Sort by:</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="p-2 rounded-lg border border-gray-300"
              >
                <option value="stars">Stars</option>
                <option value="forks">Forks</option>
                <option value="updated">Recently Updated</option>
              </select>
            </div>
            {languages.length > 0 && (
              <div>
                <label className="mr-2 font-medium">Filter by language:</label>
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="p-2 rounded-lg border border-gray-300"
                >
                  <option value="">All Languages</option>
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : repos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {repos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} darkMode={darkMode} />
              ))}
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                Previous
              </button>
              <span className="flex items-center text-white font-medium">
                Page {page}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={repos.length < perPage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                Next
              </button>
            </div>
          </>
        ) : query && !loading ? (
          <div className="text-center text-xl text-white p-8">
            No repositories found. Try a different search term.
          </div>
        ) : null}
      </div>
    </div>
  );
};

const RepoCard = ({ repo, darkMode }) => {
  return (
    <div
      className={`${
        darkMode ? "bg-gray-800 text-white" : "bg-white"
      } rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-102 h-full flex flex-col`}
    >
      <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
        {repo.name}
      </h2>

      <div className="flex items-center gap-3 mb-4">
        <img
          src={repo.owner.avatarUrl}
          alt={repo.owner.login}
          className="w-10 h-10 rounded-full"
        />
        <a
          href={repo.owner.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-700 dark:text-gray-300 hover:underline"
        >
          {repo.owner.login}
        </a>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-4 flex-grow">
        {repo.description}
      </p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Language:
          </span>
          <p className="text-gray-600 dark:text-gray-400">{repo.language}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            ⭐ Stars:
          </span>
          <p className="text-gray-600 dark:text-gray-400">{repo.stars}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            🍴 Forks:
          </span>
          <p className="text-gray-600 dark:text-gray-400">{repo.forks}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            ⚠️ Issues:
          </span>
          <p className="text-gray-600 dark:text-gray-400">{repo.issues}</p>
        </div>
      </div>

      {repo.topics.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {repo.topics.slice(0, 3).map((topic, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full text-xs"
              >
                {topic}
              </span>
            ))}
            {repo.topics.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full text-xs">
                +{repo.topics.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto pt-4">
        <a
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          View on GitHub
        </a>
      </div>
    </div>
  );
};

export default RepoFinder;
