import { useState, useEffect } from "react";
import axios from "axios";
import RepoCard from "./RepoCard";

const RepoDetails = () => {
  const [repoName, setRepoName] = useState("");
  const [repos, setRepos] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("stars");
  const [languageFilter, setLanguageFilter] = useState("");
  const [languages, setLanguages] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const perPage = 10;

  const GITHUB_TOKEN =
    "";

  const fetchRepos = async (resetPage = false) => {
    setError("");
    setRepos([]);
    setLoading(true);

    try {
      const searchResponse = await axios.get(
        `https://api.github.com/search/repositories?q=${repoName}+in:name${
          languageFilter ? `+language:${languageFilter}` : ""
        }&sort=${sort}&page=${resetPage ? 1 : page}&per_page=${perPage}`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${GITHUB_TOKEN}`,
          },
        }
      );

      const repoPromises = searchResponse.data.items.map(async (item) => {
        const detailsResponse = await axios.get(
          `https://api.github.com/repos/${item.full_name}`,
          {
            headers: {
              Accept: "application/vnd.github+json",
              Authorization: `Bearer ${GITHUB_TOKEN}`,
            },
          }
        );

        const contributorsResponse = await axios.get(
          detailsResponse.data.contributors_url,
          {
            headers: {
              Accept: "application/vnd.github+json",
              Authorization: `Bearer ${GITHUB_TOKEN}`,
            },
          }
        );

        const commitsResponse = await axios.get(
          detailsResponse.data.commits_url.replace("{/sha}", ""),
          {
            headers: {
              Accept: "application/vnd.github+json",
              Authorization: `Bearer ${GITHUB_TOKEN}`,
            },
            params: { per_page: 1 },
          }
        );

        const languagesResponse = await axios.get(
          detailsResponse.data.languages_url,
          {
            headers: {
              Accept: "application/vnd.github+json",
              Authorization: `Bearer ${GITHUB_TOKEN}`,
            },
          }
        );

        return {
          ...detailsResponse.data,
          contributors_count: contributorsResponse.data.length,
          commit_count: commitsResponse.headers["link"]
            ? parseInt(
                commitsResponse.headers["link"].match(/page=(\d+)/)?.[1]
              ) || "Unknown"
            : commitsResponse.data.length,
          languages: Object.keys(languagesResponse.data),
        };
      });

      const repoData = await Promise.all(repoPromises);
      setRepos(repoData);

      // Extract unique languages for filter
      const allLanguages = new Set(
        repoData.flatMap((repo) => repo.languages || [])
      );
      setLanguages([...allLanguages]);

      if (resetPage) setPage(1);
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setError(
            "Invalid or unauthorized GitHub token. Please check your token."
          );
        } else if (err.response.status === 403) {
          setError(
            "API rate limit exceeded. Try again later or use a valid token."
          );
        } else {
          setError(`Error fetching repositories: ${err.response.data.message}`);
        }
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!repoName.trim()) {
      setError("Please enter a repository name.");
      return;
    }
    fetchRepos(true);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchRepos();
  };

  useEffect(() => {
    if (repos.length > 0) fetchRepos();
  }, [sort, languageFilter]);

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? "bg-gray-900 text-white"
          : "bg-gradient-to-br from-blue-500 to-purple-600 text-gray-900"
      } transition-colors duration-300`}
    >
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-center">
            GitHub Repository Finder
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="Enter repository name (e.g., EDU_Connect_Backend)"
              className="flex-1 p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-blue-300 transition transform hover:scale-105"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div>
            <label className="mr-2 font-medium">Sort by:</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="stars">Stars</option>
              <option value="forks">Forks</option>
              <option value="updated">Updated</option>
            </select>
          </div>
          <div>
            <label className="mr-2 font-medium">Filter by language:</label>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {repos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {repos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
        ) : (
          !error &&
          !loading && (
            <p className="text-center text-lg">
              No repositories found. Try a different search.
            </p>
          )
        )}

        {repos.length > 0 && (
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-gray-600 transition transform hover:scale-105"
            >
              Previous
            </button>
            <span className="py-2 text-lg">Page {page}</span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={repos.length < perPage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-gray-600 transition transform hover:scale-105"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepoDetails;
