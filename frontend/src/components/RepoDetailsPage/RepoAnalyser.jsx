import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./RepoAnalyser.css";
import { Container, Row, Col, Spinner, Card } from "react-bootstrap";
import { Tabs, Tab, Button as MuiButton, Typography } from "@mui/material";
import { Card as JoyCard, CardContent } from "@mui/joy";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import "bootstrap/dist/css/bootstrap.min.css";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const RepoAnalyzer = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [repoData, setRepoData] = useState(null);
  const [commits, setCommits] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [languages, setLanguages] = useState({});
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isBackendLoading, setIsBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  // Hardcoded GitHub API token
  const GITHUB_API_TOKEN =
    "";

  // Color palette for charts
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#8dd1e1",
    "#a4de6c",
    "#d0ed57",
  ];

  // Initialize repoUrl from navigation state
  useEffect(() => {
    const { repoLink } = location.state || {};
    if (repoLink) {
      setRepoUrl(repoLink);
      try {
        const { owner, repo } = parseGitHubUrl(repoLink);
        fetchRepoData(owner, repo);
      } catch (err) {
        setError(err.message);
      }
    }
  }, [location.state]);

  const parseGitHubUrl = (url) => {
    try {
      if (url.endsWith(".git")) {
        url = url.slice(0, -4);
      }
      const urlObj = new URL(url);
      if (urlObj.hostname !== "github.com") {
        throw new Error("Not a GitHub URL");
      }
      const pathParts = urlObj.pathname.split("/").filter((part) => part);
      if (pathParts.length < 2) {
        throw new Error("Invalid GitHub repository URL");
      }
      return {
        owner: pathParts[0],
        repo: pathParts[1],
      };
    } catch (err) {
      throw new Error("Please enter a valid GitHub repository URL");
    }
  };

  const fetchRepoData = async (owner, repo) => {
    setLoading(true);
    setError("");
    setRepoData(null);
    setCommits([]);
    setContributors([]);
    setLanguages({});
    setIssues([]);

    try {
      const headers = new Headers();
      headers.append("Authorization", `token ${GITHUB_API_TOKEN}`);

      const repoResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers }
      );
      if (!repoResponse.ok) {
        if (
          repoResponse.status === 403 &&
          repoResponse.headers.get("X-RateLimit-Remaining") === "0"
        ) {
          throw new Error(
            "GitHub API rate limit exceeded. Please try again later."
          );
        }
        throw new Error(
          `Repository not found or API error (${repoResponse.status})`
        );
      }
      const repoResult = await repoResponse.json();
      setRepoData(repoResult);

      const commitsResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`,
        { headers }
      );
      if (commitsResponse.ok) {
        const commitsResult = await commitsResponse.json();
        setCommits(commitsResult);
      }

      const contributorsResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`,
        { headers }
      );
      if (contributorsResponse.ok) {
        const contributorsResult = await contributorsResponse.json();
        setContributors(contributorsResult);
      }

      const languagesResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/languages`,
        { headers }
      );
      if (languagesResponse.ok) {
        const languagesResult = await languagesResponse.json();
        setLanguages(languagesResult);
      }

      const issuesResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`,
        { headers }
      );
      if (issuesResponse.ok) {
        const issuesResult = await issuesResponse.json();
        setIssues(issuesResult);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackendSubmit = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) {
      setBackendError("Please enter a GitHub repository URL");
      return;
    }
    if (!repoUrl.includes("github.com")) {
      setBackendError("Please enter a valid GitHub repository URL");
      return;
    }
    setBackendError("");
    setIsBackendLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:8000/analyze",
        { github_link: repoUrl.trim() },
        { headers: { "Content-Type": "application/json" } }
      );
      navigate("/results", {
        state: { results: response.data, repoLink: repoUrl.trim() },
      });
    } catch (err) {
      console.error("API Error:", err.response?.data || err.message);
      setBackendError(
        `Failed to analyze repository: ${
          err.response?.data?.detail || "Please check backend and try again."
        }`
      );
    } finally {
      setIsBackendLoading(false);
    }
  };

  // Process chart data
  const languagesChartData = Object.entries(languages).map(([name, bytes]) => ({
    name,
    value: bytes,
    percentage: 0,
  }));

  if (languagesChartData.length > 0) {
    const totalBytes = languagesChartData.reduce(
      (sum, item) => sum + item.value,
      0
    );
    languagesChartData.forEach((item) => {
      item.percentage = ((item.value / totalBytes) * 100).toFixed(1);
    });
  }

  const contributorsChartData = contributors
    .slice(0, 10)
    .map((contributor) => ({
      name: contributor.login,
      contributions: contributor.contributions,
    }));

  const openIssues = issues.filter((issue) => issue.state === "open").length;
  const closedIssues = issues.filter(
    (issue) => issue.state === "closed"
  ).length;

  const issuesChartData = [
    { name: "Open", value: openIssues },
    { name: "Closed", value: closedIssues },
  ];

  const commitsByAuthor = {};
  commits.forEach((commit) => {
    const author = commit.commit.author.name;
    commitsByAuthor[author] = (commitsByAuthor[author] || 0) + 1;
  });

  const commitsChartData = Object.entries(commitsByAuthor)
    .map(([name, count]) => ({ name, commits: count }))
    .sort((a, b) => b.commits - a.commits)
    .slice(0, 10);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    // <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white p-6">
    //   <div className="max-w-6xl mx-auto">
    //     {error && (
    //       <div className="p-4 mb-8 bg-red-500/80 text-white rounded-lg">
    //         {error}
    //       </div>
    //     )}

    //     {loading && (
    //       <div className="flex justify-center items-center p-12">
    //         <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-500"></div>
    //       </div>
    //     )}

    //     {repoData && !loading && (
    //       <>
    //         {/* Repository Header */}
    //         <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8">
    //           <div className="flex flex-col md:flex-row gap-6 items-start">
    //             <img
    //               src={repoData.owner.avatar_url}
    //               alt={repoData.owner.login}
    //               className="w-24 h-24 rounded-full"
    //             />
    //             <div className="flex-1">
    //               <h2 className="text-2xl font-bold">{repoData.name}</h2>
    //               <p className="text-blue-300">{repoData.full_name}</p>
    //               <p className="my-3">{repoData.description}</p>
    //               <div className="flex flex-wrap gap-3 mt-3">
    //                 <div className="bg-blue-900/50 px-3 py-1 rounded-full text-sm">
    //                   ⭐ {repoData.stargazers_count} Stars
    //                 </div>
    //                 <div className="bg-blue-900/50 px-3 py-1 rounded-full text-sm">
    //                   🍴 {repoData.forks_count} Forks
    //                 </div>
    //                 <div className="bg-blue-900/50 px-3 py-1 rounded-full text-sm">
    //                   👁️ {repoData.watchers_count} Watchers
    //                 </div>
    //                 <div className="bg-blue-900/50 px-3 py-1 rounded-full text-sm">
    //                   ⚠️ {repoData.open_issues_count} Issues
    //                 </div>
    //               </div>
    //             </div>
    //             <a
    //               href={repoData.html_url}
    //               target="_blank"
    //               rel="noopener noreferrer"
    //               className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
    //             >
    //               View on GitHub
    //             </a>
    //           </div>
    //         </div>

    //         {/* Tab Navigation */}
    //         <div className="flex flex-wrap gap-2 mb-6">
    //           <button
    //             onClick={() => setActiveTab("overview")}
    //             className={`px-4 py-2 rounded-lg transition ${
    //               activeTab === "overview"
    //                 ? "bg-blue-600"
    //                 : "bg-blue-900/50 hover:bg-blue-800"
    //             }`}
    //           >
    //             Overview
    //           </button>
    //           <button
    //             onClick={() => setActiveTab("stats")}
    //             className={`px-4 py-2 rounded-lg transition ${
    //               activeTab === "stats"
    //                 ? "bg-blue-600"
    //                 : "bg-blue-900/50 hover:bg-blue-800"
    //             }`}
    //           >
    //             Charts & Stats
    //           </button>
    //           <button
    //             onClick={() => setActiveTab("contributors")}
    //             className={`px-4 py-2 rounded-lg transition ${
    //               activeTab === "contributors"
    //                 ? "bg-blue-600"
    //                 : "bg-blue-900/50 hover:bg-blue-800"
    //             }`}
    //           >
    //             Contributors
    //           </button>
    //           <button
    //             onClick={() => setActiveTab("details")}
    //             className={`px-4 py-2 rounded-lg transition ${
    //               activeTab === "details"
    //                 ? "bg-blue-600"
    //                 : "bg-blue-900/50 hover:bg-blue-800"
    //             }`}
    //           >
    //             All Details
    //           </button>
    //         </div>

    //         {/* Overview Tab */}
    //         {activeTab === "overview" && (
    //           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    //             <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
    //               <h3 className="text-xl font-semibold mb-4">
    //                 Basic Information
    //               </h3>
    //               <div className="space-y-3">
    //                 <div>
    //                   <span className="text-blue-300">Repository Name:</span>
    //                   <p>{repoData.name}</p>
    //                 </div>
    //                 <div>
    //                   <span className="text-blue-300">Owner:</span>
    //                   <p>{repoData.owner.login}</p>
    //                 </div>
    //                 <div>
    //                   <span className="text-blue-300">Description:</span>
    //                   <p>{repoData.description || "No description provided"}</p>
    //                 </div>
    //                 <div>
    //                   <span className="text-blue-300">Default Branch:</span>
    //                   <p>{repoData.default_branch}</p>
    //                 </div>
    //                 <div>
    //                   <span className="text-blue-300">Created:</span>
    //                   <p>{formatDate(repoData.created_at)}</p>
    //                 </div>
    //                 <div>
    //                   <span className="text-blue-300">Last Updated:</span>
    //                   <p>{formatDate(repoData.updated_at)}</p>
    //                 </div>
    //                 <div>
    //                   <span className="text-blue-300">License:</span>
    //                   <p>
    //                     {repoData.license
    //                       ? repoData.license.name
    //                       : "No license"}
    //                   </p>
    //                 </div>
    //                 <div>
    //                   <span className="text-blue-300">Homepage:</span>
    //                   <p>
    //                     {repoData.homepage ? (
    //                       <a
    //                         href={repoData.homepage}
    //                         target="_blank"
    //                         rel="noopener noreferrer"
    //                         className="text-blue-400 hover:underline"
    //                       >
    //                         {repoData.homepage}
    //                       </a>
    //                     ) : (
    //                       "No homepage"
    //                     )}
    //                   </p>
    //                 </div>
    //               </div>
    //             </div>

    //             <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
    //               <h3 className="text-xl font-semibold mb-4">
    //                 Language Distribution
    //               </h3>
    //               {languagesChartData.length > 0 ? (
    //                 <ResponsiveContainer width="100%" height={300}>
    //                   <PieChart>
    //                     <Pie
    //                       data={languagesChartData}
    //                       cx="50%"
    //                       cy="50%"
    //                       labelLine={false}
    //                       outerRadius={100}
    //                       fill="#8884d8"
    //                       dataKey="value"
    //                       label={({ name, percentage }) =>
    //                         `${name}: ${percentage}%`
    //                       }
    //                     >
    //                       {languagesChartData.map((entry, index) => (
    //                         <Cell
    //                           key={`cell-${index}`}
    //                           fill={COLORS[index % COLORS.length]}
    //                         />
    //                       ))}
    //                     </Pie>
    //                     <Tooltip
    //                       formatter={(value) =>
    //                         `${(value / 1024).toFixed(2)} KB`
    //                       }
    //                     />
    //                   </PieChart>
    //                 </ResponsiveContainer>
    //               ) : (
    //                 <p className="text-center py-12">
    //                   No language data available
    //                 </p>
    //               )}
    //             </div>

    //             <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
    //               <h3 className="text-xl font-semibold mb-4">
    //                 Top Contributors
    //               </h3>
    //               {contributorsChartData.length > 0 ? (
    //                 <ResponsiveContainer width="100%" height={300}>
    //                   <BarChart data={contributorsChartData.slice(0, 5)}>
    //                     <CartesianGrid strokeDasharray="3 3" stroke="#555" />
    //                     <XAxis dataKey="name" stroke="#ddd" />
    //                     <YAxis stroke="#ddd" />
    //                     <Tooltip
    //                       contentStyle={{
    //                         backgroundColor: "#1f2937",
    //                         borderColor: "#6366f1",
    //                         color: "#fff",
    //                       }}
    //                     />
    //                     <Bar dataKey="contributions" fill="#6366f1" />
    //                   </BarChart>
    //                 </ResponsiveContainer>
    //               ) : (
    //                 <p className="text-center py-12">
    //                   No contributor data available
    //                 </p>
    //               )}
    //             </div>

    //             <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
    //               <h3 className="text-xl font-semibold mb-4">Issues Status</h3>
    //               {issuesChartData[0].value + issuesChartData[1].value > 0 ? (
    //                 <ResponsiveContainer width="100%" height={300}>
    //                   <PieChart>
    //                     <Pie
    //                       data={issuesChartData}
    //                       cx="50%"
    //                       cy="50%"
    //                       labelLine={true}
    //                       outerRadius={100}
    //                       fill="#8884d8"
    //                       dataKey="value"
    //                       label={({ name, value }) => `${name}: ${value}`}
    //                     >
    //                       <Cell fill="#ff5252" />
    //                       <Cell fill="#4caf50" />
    //                     </Pie>
    //                     <Tooltip />
    //                     <Legend />
    //                   </PieChart>
    //                 </ResponsiveContainer>
    //               ) : (
    //                 <p className="text-center py-12">No issue data available</p>
    //               )}
    //             </div>
    //           </div>
    //         )}

    //         {/* Stats Tab */}
    //         {activeTab === "stats" && (
    //           <div className="space-y-8">
    //             <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
    //               <h3 className="text-xl font-semibold mb-4">
    //                 Language Distribution
    //               </h3>
    //               {languagesChartData.length > 0 ? (
    //                 <ResponsiveContainer width="100%" height={400}>
    //                   <PieChart>
    //                     <Pie
    //                       data={languagesChartData}
    //                       cx="50%"
    //                       cy="50%"
    //                       labelLine={false}
    //                       outerRadius={150}
    //                       fill="#8884d8"
    //                       dataKey="value"
    //                       label={({ name, percentage }) =>
    //                         `${name}: ${percentage}%`
    //                       }
    //                     >
    //                       {languagesChartData.map((entry, index) => (
    //                         <Cell
    //                           key={`cell-${index}`}
    //                           fill={COLORS[index % COLORS.length]}
    //                         />
    //                       ))}
    //                     </Pie>
    //                     <Tooltip
    //                       formatter={(value) =>
    //                         `${(value / 1024).toFixed(2)} KB`
    //                       }
    //                     />
    //                     <Legend />
    //                   </PieChart>
    //                 </ResponsiveContainer>
    //               ) : (
    //                 <p className="text-center py-12">
    //                   No language data available
    //                 </p>
    //               )}
    //             </div>

    //             <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
    //               <h3 className="text-xl font-semibold mb-4">
    //                 Top Contributors
    //               </h3>
    //               {contributorsChartData.length > 0 ? (
    //                 <ResponsiveContainer width="100%" height={400}>
    //                   <BarChart data={contributorsChartData}>
    //                     <CartesianGrid strokeDasharray="3 3" stroke="#555" />
    //                     <XAxis dataKey="name" stroke="#ddd" />
    //                     <YAxis stroke="#ddd" />
    //                     <Tooltip
    //                       contentStyle={{
    //                         backgroundColor: "#1f2937",
    //                         borderColor: "#6366f1",
    //                         color: "#fff",
    //                       }}
    //                     />
    //                     <Legend />
    //                     <Bar
    //                       dataKey="contributions"
    //                       name="Contributions"
    //                       fill="#6366f1"
    //                     />
    //                   </BarChart>
    //                 </ResponsiveContainer>
    //               ) : (
    //                 <p className="text-center py-12">
    //                   No contributor data available
    //                 </p>
    //               )}
    //             </div>

    //             <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
    //               <h3 className="text-xl font-semibold mb-4">Top Committers</h3>
    //               {commitsChartData.length > 0 ? (
    //                 <ResponsiveContainer width="100%" height={400}>
    //                   <BarChart data={commitsChartData}>
    //                     <CartesianGrid strokeDasharray="3 3" stroke="#555" />
    //                     <XAxis dataKey="name" stroke="#ddd" />
    //                     <YAxis stroke="#ddd" />
    //                     <Tooltip
    //                       contentStyle={{
    //                         backgroundColor: "#1f2937",
    //                         borderColor: "#8884d8",
    //                         color: "#fff",
    //                       }}
    //                     />
    //                     <Legend />
    //                     <Bar dataKey="commits" name="Commits" fill="#8884d8" />
    //                   </BarChart>
    //                 </ResponsiveContainer>
    //               ) : (
    //                 <p className="text-center py-12">
    //                   No commit data available
    //                 </p>
    //               )}
    //             </div>

    //             <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
    //               <h3 className="text-xl font-semibold mb-4">Issues Status</h3>
    //               {issuesChartData[0].value + issuesChartData[1].value > 0 ? (
    //                 <ResponsiveContainer width="100%" height={400}>
    //                   <PieChart>
    //                     <Pie
    //                       data={issuesChartData}
    //                       cx="50%"
    //                       cy="50%"
    //                       labelLine={true}
    //                       outerRadius={150}
    //                       fill="#8884d8"
    //                       dataKey="value"
    //                       label={({ name, value }) => `${name}: ${value}`}
    //                     >
    //                       <Cell fill="#ff5252" />
    //                       <Cell fill="#4caf50" />
    //                     </Pie>
    //                     <Tooltip />
    //                     <Legend />
    //                   </PieChart>
    //                 </ResponsiveContainer>
    //               ) : (
    //                 <p className="text-center py-12">No issue data available</p>
    //               )}
    //             </div>
    //           </div>
    //         )}

    //         {/* Contributors Tab */}
    //         {activeTab === "contributors" && (
    //           <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
    //             <h3 className="text-xl font-semibold mb-6">All Contributors</h3>
    //             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    //               {contributors.map((contributor) => (
    //                 <div
    //                   key={contributor.id}
    //                   className="bg-gray-800/50 rounded-lg p-4 flex flex-col items-center"
    //                 >
    //                   <img
    //                     src={contributor.avatar_url}
    //                     alt={contributor.login}
    //                     className="w-16 h-16 rounded-full mb-3"
    //                   />
    //                   <h4 className="font-medium text-center">
    //                     {contributor.login}
    //                   </h4>
    //                   <p className="text-blue-300 text-sm">
    //                     {contributor.contributions} contributions
    //                   </p>
    //                   <a
    //                     href={contributor.html_url}
    //                     target="_blank"
    //                     rel="noopener noreferrer"
    //                     className="mt-2 text-xs text-blue-400 hover:underline"
    //                   >
    //                     View Profile
    //                   </a>
    //                 </div>
    //               ))}
    //             </div>
    //             {contributors.length === 0 && (
    //               <p className="text-center py-12">
    //                 No contributor data available
    //               </p>
    //             )}
    //           </div>
    //         )}

    //         {/* All Details Tab */}
    //         {activeTab === "details" && (
    //           <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
    //             <h3 className="text-xl font-semibold mb-6">
    //               Complete Repository Details
    //             </h3>
    //             <div className="overflow-x-auto">
    //               <table className="w-full text-left">
    //                 <tbody>
    //                   {Object.entries(repoData).map(([key, value]) => {
    //                     if (
    //                       typeof value === "object" &&
    //                       value !== null &&
    //                       !Array.isArray(value)
    //                     ) {
    //                       return null;
    //                     }
    //                     if (Array.isArray(value)) {
    //                       return (
    //                         <tr key={key} className="border-b border-gray-700">
    //                           <td className="py-3 px-4 font-medium text-blue-300">
    //                             {key}
    //                           </td>
    //                           <td className="py-3 px-4">
    //                             {value.length > 0
    //                               ? `[Array with ${value.length} items]`
    //                               : "[]"}
    //                           </td>
    //                         </tr>
    //                       );
    //                     }
    //                     if (
    //                       typeof value === "string" &&
    //                       value.match(/^\d{4}-\d{2}-\d{2}T/)
    //                     ) {
    //                       return (
    //                         <tr key={key} className="border-b border-gray-700">
    //                           <td className="py-3 px-4 font-medium text-blue-300">
    //                             {key}
    //                           </td>
    //                           <td className="py-3 px-4">{formatDate(value)}</td>
    //                         </tr>
    //                       );
    //                     }
    //                     if (typeof value === "boolean") {
    //                       return (
    //                         <tr key={key} className="border-b border-gray-700">
    //                           <td className="py-3 px-4 font-medium text-blue-300">
    //                             {key}
    //                           </td>
    //                           <td className="py-3 px-4">
    //                             {value ? "Yes" : "No"}
    //                           </td>
    //                         </tr>
    //                       );
    //                     }
    //                     if (value === null) {
    //                       return (
    //                         <tr key={key} className="border-b border-gray-700">
    //                           <td className="py-3 px-4 font-medium text-blue-300">
    //                             {key}
    //                           </td>
    //                           <td className="py-3 px-4">None</td>
    //                         </tr>
    //                       );
    //                     }
    //                     return (
    //                       <tr key={key} className="border-b border-gray-700">
    //                         <td className="py-3 px-4 font-medium text-blue-300">
    //                           {key}
    //                         </td>
    //                         <td className="py-3 px-4">{String(value)}</td>
    //                       </tr>
    //                     );
    //                   })}
    //                 </tbody>
    //               </table>
    //             </div>

    //             <h4 className="text-lg font-medium mt-8 mb-4">Owner Details</h4>
    //             <div className="overflow-x-auto">
    //               <table className="w-full text-left">
    //                 <tbody>
    //                   {Object.entries(repoData.owner).map(([key, value]) => {
    //                     if (typeof value === "object" && value !== null) {
    //                       return null;
    //                     }
    //                     return (
    //                       <tr key={key} className="border-b border-gray-700">
    //                         <td className="py-3 px-4 font-medium text-blue-300">
    //                           {key}
    //                         </td>
    //                         <td className="py-3 px-4">
    //                           {key.includes("url") &&
    //                           typeof value === "string" ? (
    //                             <a
    //                               href={value}
    //                               target="_blank"
    //                               rel="noopener noreferrer"
    //                               className="text-blue-400 hover:underline"
    //                             >
    //                               {value}
    //                             </a>
    //                           ) : (
    //                             String(value)
    //                           )}
    //                         </td>
    //                       </tr>
    //                     );
    //                   })}
    //                 </tbody>
    //               </table>
    //             </div>

    //             <h4 className="text-lg font-medium mt-8 mb-4">Languages</h4>
    //             <div className="overflow-x-auto">
    //               <table className="w-full text-left">
    //                 <thead>
    //                   <tr className="border-b border-gray-700">
    //                     <th className="py-3 px-4">Language</th>
    //                     <th className="py-3 px-4">Bytes</th>
    //                     <th className="py-3 px-4">Percentage</th>
    //                   </tr>
    //                 </thead>
    //                 <tbody>
    //                   {languagesChartData.map((lang, index) => (
    //                     <tr key={index} className="border-b border-gray-700">
    //                       <td className="py-3 px-4">{lang.name}</td>
    //                       <td className="py-3 px-4">
    //                         {lang.value.toLocaleString()} bytes
    //                       </td>
    //                       <td className="py-3 px-4">{lang.percentage}%</td>
    //                     </tr>
    //                   ))}
    //                 </tbody>
    //               </table>
    //             </div>
    //           </div>
    //         )}

    //         {/* Backend API Button */}
    //         <div className="mt-8 flex justify-center">
    //           <button
    //             onClick={handleBackendSubmit}
    //             disabled={isBackendLoading}
    //             className={`px-6 py-3 rounded-lg text-white transition transform hover:scale-105 ${
    //               isBackendLoading
    //                 ? "bg-blue-400 cursor-not-allowed"
    //                 : "bg-blue-600 hover:bg-blue-700"
    //             }`}
    //           >
    //             {isBackendLoading ? "Analyzing..." : "Analyze with Backend"}
    //           </button>
    //         </div>
    //         {backendError && (
    //           <div className="mt-4 p-4 bg-red-500/80 text-white rounded-lg text-center">
    //             {backendError}
    //           </div>
    //         )}
    //       </>
    //     )}
    //   </div>
    // </div>
    <div id="repo-analyser-main" className="min-vh-100 text-white py-4">
      <Container className="py-4">
        {/* Error Message */}
        {error && (
          <JoyCard className="mb-4 glass-effect bg-danger text-white">
            <CardContent>{error}</CardContent>
          </JoyCard>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner
              animation="border"
              variant="primary"
              style={{ width: "5rem", height: "5rem" }}
            />
          </div>
        )}

        {/* Repository Content */}
        {repoData && !loading && (
          <>
            {/* Repository Header */}
            <JoyCard className="glass-effect mb-4">
              <CardContent>
                <Row className="align-items-start">
                  <Col xs={12} md={2} className="text-center text-md-start">
                    <img
                      src={repoData.owner.avatar_url}
                      alt={repoData.owner.login}
                      className="rounded-circle"
                      style={{ width: "80px", height: "80px" }}
                    />
                  </Col>
                  <Col xs={12} md={8}>
                    <Typography variant="h5" fontWeight="bold">
                      {repoData.name}
                    </Typography>
                    <Typography color="primary" className="mb-2">
                      {repoData.full_name}
                    </Typography>
                    <Typography
                      sx={{ fontFamily: "Poppins, sans-serif" }}
                      className="my-2"
                    >
                      {repoData.description || "No description provided"}
                    </Typography>
                    <div className="d-flex flex-wrap gap-2 mt-3">
                      <span className="badge bg-primary bg-opacity-75">
                        ⭐ {repoData.stargazers_count} Stars
                      </span>
                      <span className="badge bg-primary bg-opacity-75">
                        🍴 {repoData.forks_count} Forks
                      </span>
                      <span className="badge bg-primary bg-opacity-75">
                        👁️ {repoData.watchers_count} Watchers
                      </span>
                      <span className="badge bg-primary bg-opacity-75">
                        ⚠️ {repoData.open_issues_count} Issues
                      </span>
                    </div>
                  </Col>
                  <Col
                    xs={12}
                    md={2}
                    className="text-center text-md-end mt-3 mt-md-0"
                  >
                    <MuiButton
                      variant="contained"
                      color="success"
                      href={repoData.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on GitHub
                    </MuiButton>
                  </Col>
                </Row>
              </CardContent>
            </JoyCard>

            {/* Tab Navigation */}
            <Tabs
              value={activeTab}
              onChange={(event, newValue) => setActiveTab(newValue)}
              centered
              className="mb-4"
              sx={{
                ".MuiTabs-indicator": { backgroundColor: "#1976d2" },
              }}
            >
              <Tab
                value="overview"
                label="Overview"
                sx={{
                  color: "#fff",
                  fontFamily: "Poppins, sans-serif",
                  "&.Mui-selected": { color: "#1976d2" },
                }}
              />
              <Tab
                value="stats"
                label="Charts & Stats"
                sx={{
                  color: "#fff",
                  fontFamily: "Poppins, sans-serif",
                  "&.Mui-selected": { color: "#1976d2" },
                }}
              />
              <Tab
                value="contributors"
                label="Contributors"
                sx={{
                  color: "#fff",
                  fontFamily: "Poppins, sans-serif",
                  "&.Mui-selected": { color: "#1976d2" },
                }}
              />
              <Tab
                value="details"
                label="All Details"
                sx={{
                  color: "#fff",
                  fontFamily: "Poppins, sans-serif",
                  "&.Mui-selected": { color: "#1976d2" },
                }}
              />
            </Tabs>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <Row>
                <Col md={6} className="mb-4">
                  <JoyCard className="glass-effect">
                    <CardContent sx={{ fontFamily: "Poppins, sans-serif" }}>
                      <Typography
                        sx={{ fontFamily: "Poppins, sans-serif" }}
                        variant="h6"
                        fontWeight="bold"
                        className="mb-3"
                      >
                        Basic Information
                      </Typography>
                      <div className="d-flex flex-column gap-2">
                        <div>
                          <strong className="text-primary">
                            Repository Name:
                          </strong>{" "}
                          {repoData.name}
                        </div>
                        <div>
                          <strong className="text-primary">Owner:</strong>{" "}
                          {repoData.owner.login}
                        </div>
                        <div>
                          <strong className="text-primary">Description:</strong>{" "}
                          {repoData.description || "No description provided"}
                        </div>
                        <div>
                          <strong className="text-primary">
                            Default Branch:
                          </strong>{" "}
                          {repoData.default_branch}
                        </div>
                        <div>
                          <strong className="text-primary">Created:</strong>{" "}
                          {formatDate(repoData.created_at)}
                        </div>
                        <div>
                          <strong className="text-primary">
                            Last Updated:
                          </strong>{" "}
                          {formatDate(repoData.updated_at)}
                        </div>
                        <div>
                          <strong className="text-primary">License:</strong>{" "}
                          {repoData.license
                            ? repoData.license.name
                            : "No license"}
                        </div>
                        <div>
                          <strong className="text-primary">Homepage:</strong>{" "}
                          {repoData.homepage ? (
                            <a
                              href={repoData.homepage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary"
                            >
                              {repoData.homepage}
                            </a>
                          ) : (
                            "No homepage"
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </JoyCard>
                </Col>
                <Col md={6} className="mb-4">
                  <JoyCard className="glass-effect">
                    <CardContent sx={{ fontFamily: "Poppins, sans-serif" }}>
                      <Typography
                        sx={{ fontFamily: "Poppins, sans-serif" }}
                        variant="h6"
                        fontWeight="bold"
                        className="mb-3"
                      >
                        Language Distribution
                      </Typography>
                      {languagesChartData.length > 0 ? (
                        <Pie
                          data={{
                            labels: languagesChartData.map((lang) => lang.name),
                            datasets: [
                              {
                                data: languagesChartData.map(
                                  (lang) => lang.value
                                ),
                                backgroundColor: [
                                  "#FF6384",
                                  "#36A2EB",
                                  "#FFCE56",
                                  "#4BC0C0",
                                  "#9966FF",
                                  "#FF9F40",
                                ],
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            rotation: -90, // Start at top
                            circumference: 180,
                            plugins: {
                              legend: {
                                position: "bottom",
                                labels: { color: "#000000" },
                              },
                              tooltip: {
                                callbacks: {
                                  label: (context) =>
                                    `${(context.raw / 1024).toFixed(2)} KB`,
                                },
                              },
                            },
                          }}
                        />
                      ) : (
                        <Typography textAlign="center" className="py-5">
                          No language data available
                        </Typography>
                      )}
                    </CardContent>
                  </JoyCard>
                </Col>
                <Col md={6} className="mb-4">
                  <JoyCard className="glass-effect">
                    <CardContent sx={{ fontFamily: "Poppins, sans-serif" }}>
                      <Typography
                        sx={{ fontFamily: "Poppins, sans-serif" }}
                        variant="h6"
                        fontWeight="bold"
                        className="mb-3"
                      >
                        Top Contributors
                      </Typography>
                      {contributorsChartData.length > 0 ? (
                        <Bar
                          sx={{ fontFamily: "Poppins, sans-serif" }}
                          data={{
                            labels: contributorsChartData
                              .slice(0, 5)
                              .map((c) => c.name),
                            datasets: [
                              {
                                label: "Contributions",
                                data: contributorsChartData
                                  .slice(0, 5)
                                  .map((c) => c.contributions),
                                backgroundColor: "#6366f1",
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: {
                                position: "bottom",
                                labels: { color: "#000000" },
                              },
                              tooltip: {
                                backgroundColor: "#1f2937",
                                borderColor: "#6366f1",
                                borderWidth: 1,
                              },
                            },
                            scales: {
                              x: {
                                ticks: { color: "#000000" },
                                grid: { display: false },
                              },
                              y: {
                                ticks: { color: "#000000" },
                                grid: { color: "#555" },
                              },
                            },
                          }}
                        />
                      ) : (
                        <Typography textAlign="center" className="py-5">
                          No contributor data available
                        </Typography>
                      )}
                    </CardContent>
                  </JoyCard>
                </Col>
                <Col md={6} className="mb-4">
                  <JoyCard className="glass-effect">
                    <CardContent>
                      <Typography
                        sx={{ fontFamily: "Poppins, sans-serif" }}
                        variant="h6"
                        fontWeight="bold"
                        className="mb-3"
                      >
                        Issues Status
                      </Typography>
                      {issuesChartData[0].value + issuesChartData[1].value >
                      0 ? (
                        <Pie
                          data={{
                            labels: issuesChartData.map((issue) => issue.name),
                            datasets: [
                              {
                                data: issuesChartData.map(
                                  (issue) => issue.value
                                ),
                                backgroundColor: ["#ff5252", "#4caf50"],
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            rotation: -90, // Start at top
                            circumference: 180,
                            plugins: {
                              legend: {
                                position: "bottom",
                                labels: { color: "#000000" },
                              },
                              tooltip: {},
                            },
                          }}
                        />
                      ) : (
                        <Typography textAlign="center" className="py-5">
                          No issue data available
                        </Typography>
                      )}
                    </CardContent>
                  </JoyCard>
                </Col>
              </Row>
            )}

            {/* Stats Tab */}
            {activeTab === "stats" && (
              <Row>
                <Col xs={12} className="mb-4">
                  <JoyCard className="glass-effect">
                    <CardContent>
                      <Typography
                        sx={{ fontFamily: "Poppins, sans-serif" }}
                        variant="h6"
                        fontWeight="bold"
                        className="mb-3"
                      >
                        Language Distribution
                      </Typography>
                      {languagesChartData.length > 0 ? (
                        <Pie
                          data={{
                            labels: languagesChartData.map((lang) => lang.name),
                            datasets: [
                              {
                                data: languagesChartData.map(
                                  (lang) => lang.value
                                ),
                                backgroundColor: [
                                  "#FF6384",
                                  "#36A2EB",
                                  "#FFCE56",
                                  "#4BC0C0",
                                  "#9966FF",
                                  "#FF9F40",
                                ],
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            rotation: -90, // Start at top
                            circumference: 180,
                            plugins: {
                              legend: {
                                position: "bottom",
                                labels: { color: "#000000" },
                              },
                              tooltip: {
                                callbacks: {
                                  label: (context) =>
                                    `${(context.raw / 1024).toFixed(2)} KB`,
                                },
                              },
                            },
                          }}
                        />
                      ) : (
                        <Typography textAlign="center" className="py-5">
                          No language data available
                        </Typography>
                      )}
                    </CardContent>
                  </JoyCard>
                </Col>
                <Col xs={12} className="mb-4">
                  <JoyCard className="glass-effect">
                    <CardContent>
                      <Typography
                        sx={{ fontFamily: "Poppins, sans-serif" }}
                        variant="h6"
                        fontWeight="bold"
                        className="mb-3"
                      >
                        Top Contributors
                      </Typography>
                      {contributorsChartData.length > 0 ? (
                        <Bar
                          data={{
                            labels: contributorsChartData.map((c) => c.name),
                            datasets: [
                              {
                                label: "Contributions",
                                data: contributorsChartData.map(
                                  (c) => c.contributions
                                ),
                                backgroundColor: "#6366f1",
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: {
                                position: "bottom",
                                labels: { color: "#000000" },
                              },
                              tooltip: {
                                backgroundColor: "#1f2937",
                                borderColor: "#6366f1",
                                borderWidth: 1,
                              },
                            },
                            scales: {
                              x: {
                                ticks: { color: "#000000" },
                                grid: { display: false },
                              },
                              y: {
                                ticks: { color: "#000000" },
                                grid: { color: "#555" },
                              },
                            },
                          }}
                        />
                      ) : (
                        <Typography textAlign="center" className="py-5">
                          No contributor data available
                        </Typography>
                      )}
                    </CardContent>
                  </JoyCard>
                </Col>
                <Col xs={12} className="mb-4">
                  <JoyCard className="glass-effect">
                    <CardContent>
                      <Typography
                        sx={{ fontFamily: "Poppins, sans-serif" }}
                        variant="h6"
                        fontWeight="bold"
                        className="mb-3"
                      >
                        Top Committers
                      </Typography>
                      {commitsChartData.length > 0 ? (
                        <Bar
                          data={{
                            labels: commitsChartData.map((c) => c.name),
                            datasets: [
                              {
                                label: "Commits",
                                data: commitsChartData.map((c) => c.commits),
                                backgroundColor: "#8884d8",
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: {
                                position: "bottom",
                                labels: { color: "#000000" },
                              },
                              tooltip: {
                                backgroundColor: "#1f2937",
                                borderColor: "#8884d8",
                                borderWidth: 1,
                              },
                            },
                            scales: {
                              x: {
                                ticks: { color: "#000000" },
                                grid: { display: false },
                              },
                              y: {
                                ticks: { color: "#000000" },
                                grid: { color: "#555" },
                              },
                            },
                          }}
                        />
                      ) : (
                        <Typography textAlign="center" className="py-5">
                          No commit data available
                        </Typography>
                      )}
                    </CardContent>
                  </JoyCard>
                </Col>
                <Col xs={12} className="mb-4">
                  <JoyCard className="glass-effect">
                    <CardContent>
                      <Typography
                        sx={{ fontFamily: "Poppins, sans-serif" }}
                        variant="h6"
                        fontWeight="bold"
                        className="mb-3"
                      >
                        Issues Status
                      </Typography>
                      {issuesChartData[0].value + issuesChartData[1].value >
                      0 ? (
                        <Pie
                          data={{
                            labels: issuesChartData.map((issue) => issue.name),
                            datasets: [
                              {
                                data: issuesChartData.map(
                                  (issue) => issue.value
                                ),
                                backgroundColor: ["#ff5252", "#4caf50"],
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            rotation: -90, // Start at top
                            circumference: 180,
                            plugins: {
                              legend: {
                                position: "bottom",
                                labels: { color: "#000000" },
                              },
                              tooltip: {},
                            },
                          }}
                        />
                      ) : (
                        <Typography textAlign="center" className="py-5">
                          No issue data available
                        </Typography>
                      )}
                    </CardContent>
                  </JoyCard>
                </Col>
              </Row>
            )}

            {/* Contributors Tab */}
            {activeTab === "contributors" && (
              <JoyCard className="glass-effect">
                <CardContent>
                  <Typography
                    sx={{ fontFamily: "Poppins, sans-serif" }}
                    variant="h6"
                    fontWeight="bold"
                    className="mb-4"
                  >
                    All Contributors
                  </Typography>
                  <Row sx={{ fontFamily: "Poppins, sans-serif" }}>
                    {contributors.length > 0 ? (
                      contributors.map((contributor) => (
                        <Col
                          xs={12}
                          sm={6}
                          md={4}
                          lg={3}
                          key={contributor.id}
                          className="mb-3"
                        >
                          <Card className="bg-dark text-white text-center">
                            <Card.Img
                              variant="top"
                              src={contributor.avatar_url}
                              alt={contributor.login}
                              className="rounded-circle mx-auto mt-3"
                              style={{ width: "64px", height: "64px" }}
                            />
                            <Card.Body>
                              <Card.Title>{contributor.login}</Card.Title>
                              <Card.Text
                                sx={{ fontFamily: "Poppins, sans-serif" }}
                              >
                                {contributor.contributions} contributions
                              </Card.Text>
                              <MuiButton
                                sx={{ fontFamily: "Poppins, sans-serif" }}
                                variant="text"
                                color="primary"
                                href={contributor.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View Profile
                              </MuiButton>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))
                    ) : (
                      <Typography textAlign="center" className="py-5">
                        No contributor data available
                      </Typography>
                    )}
                  </Row>
                </CardContent>
              </JoyCard>
            )}

            {/* All Details Tab */}
            {activeTab === "details" && (
              <JoyCard className="glass-effect">
                <CardContent>
                  <Typography
                    sx={{ fontFamily: "Poppins, sans-serif" }}
                    variant="h6"
                    fontWeight="bold"
                    className="mb-4"
                  >
                    Complete Repository Details
                  </Typography>
                  <div className="table-responsive">
                    <table className="table table-dark table-striped">
                      <tbody>
                        {Object.entries(repoData).map(([key, value]) => {
                          if (
                            typeof value === "object" &&
                            value !== null &&
                            !Array.isArray(value)
                          )
                            return null;
                          if (Array.isArray(value)) {
                            return (
                              <tr key={key}>
                                <td className="text-primary">{key}</td>
                                <td>
                                  {value.length > 0
                                    ? `[Array with ${value.length} items]`
                                    : "[]"}
                                </td>
                              </tr>
                            );
                          }
                          if (
                            typeof value === "string" &&
                            value.match(/^\d{4}-\d{2}-\d{2}T/)
                          ) {
                            return (
                              <tr key={key}>
                                <td className="text-primary">{key}</td>
                                <td>{formatDate(value)}</td>
                              </tr>
                            );
                          }
                          if (typeof value === "boolean") {
                            return (
                              <tr key={key}>
                                <td className="text-primary">{key}</td>
                                <td>{value ? "Yes" : "No"}</td>
                              </tr>
                            );
                          }
                          if (value === null) {
                            return (
                              <tr key={key}>
                                <td className="text-primary">{key}</td>
                                <td>None</td>
                              </tr>
                            );
                          }
                          return (
                            <tr key={key}>
                              <td className="text-primary">{key}</td>
                              <td>{String(value)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <Typography
                    sx={{ fontFamily: "Poppins, sans-serif" }}
                    variant="h6"
                    fontWeight="bold"
                    className="my-4"
                  >
                    Owner Details
                  </Typography>
                  <div className="table-responsive">
                    <table className="table table-dark table-striped">
                      <tbody>
                        {Object.entries(repoData.owner).map(([key, value]) => {
                          if (typeof value === "object" && value !== null)
                            return null;
                          return (
                            <tr key={key}>
                              <td className="text-primary">{key}</td>
                              <td>
                                {key.includes("url") &&
                                typeof value === "string" ? (
                                  <a
                                    href={value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary"
                                  >
                                    {value}
                                  </a>
                                ) : (
                                  String(value)
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <Typography
                    sx={{ fontFamily: "Poppins, sans-serif" }}
                    variant="h6"
                    fontWeight="bold"
                    className="my-4"
                  >
                    Languages
                  </Typography>
                  <div className="table-responsive">
                    <table className="table table-dark table-striped">
                      <thead>
                        <tr>
                          <th>Language</th>
                          <th>Bytes</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {languagesChartData.map((lang, index) => (
                          <tr key={index}>
                            <td>{lang.name}</td>
                            <td>{lang.value.toLocaleString()} bytes</td>
                            <td>{lang.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </JoyCard>
            )}

            {/* Backend API Button */}
            <div className="d-flex justify-content-center mt-4">
              <MuiButton
                variant="contained"
                color="primary"
                onClick={handleBackendSubmit}
                disabled={isBackendLoading}
                sx={{
                  transform: isBackendLoading ? "scale(1)" : "scale(1.05)",
                  transition: "transform 0.2s",
                }}
              >
                {isBackendLoading ? "Analyzing..." : "Analyze with Backend"}
              </MuiButton>
            </div>
            {backendError && (
              <JoyCard className="mt-4 glass-effect bg-danger text-white text-center">
                <CardContent>{backendError}</CardContent>
              </JoyCard>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default RepoAnalyzer;
