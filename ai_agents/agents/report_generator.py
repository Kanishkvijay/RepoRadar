# ai_agents/agents/report_generator.py
# ai_agents/agents/report_generator.py
from groq import Groq
from jinja2 import Environment, FileSystemLoader
import pdfkit
import os
from typing import Dict
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

class ReportGenerator:
    def __init__(self):
        self.env = Environment(loader=FileSystemLoader('templates'))
        os.makedirs("static", exist_ok=True)
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise ValueError("GROQ_API_KEY environment variable is required")
        self.client = Groq(api_key=groq_api_key)
        self.wkhtmltopdf_path = r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe"

    def generate_report(self, analysis: Dict) -> str:
        try:
            # Extract key details for LLM prompt
            analysis_summary = {
                "project_name": analysis.get("metadata", {}).get("name", "Unknown"),
                "originality_score": analysis.get("originality", {}).get("originality_score", 0.0),
                "verdict": analysis.get("originality", {}).get("verdict", "Unknown"),
                "idea_summary": analysis.get("idea_summary", "No summary available"),
                "similar_projects": analysis.get("idea_check", {}).get("similar_projects", []),
                "code_similarity": analysis.get("code_similarity", {}).get("similarity_score", 0.0),
                "copied_blocks_count": len(analysis.get("code_similarity", {}).get("copied_blocks", [])),
                "contrib_score": analysis.get("contribution_credibility", {}).get("credibility_score", 0.0)
            }
            
            # Create a concise but informative prompt
            prompt = (
                f"Generate a detailed project analysis report (200-250 words) for '{analysis_summary['project_name']}' with:\n"
                f"- Overall originality score: {analysis_summary['originality_score']:.1f}/100\n"
                f"- Verdict: {analysis_summary['verdict']}\n"
                f"- Project idea: '{analysis_summary['idea_summary']}'\n"
                f"- Code similarity score: {analysis_summary['code_similarity']:.2f}\n"
                f"- Contribution credibility: {analysis_summary['contrib_score']:.1f}/100\n"
                f"- Similar projects: {', '.join(analysis_summary['similar_projects'][:5]) if analysis_summary['similar_projects'] else 'None found'}\n"
                f"- Copied code blocks: {analysis_summary['copied_blocks_count']}\n\n"
                f"Include analysis of originality in three aspects: code implementation, project idea, and development consistency. "
                f"Explain what the scores mean and provide specific recommendations for improving originality if needed. "
                f"If originality is high, explain the project's unique strengths. Write in a professional, constructive tone."
            )
            
            response = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.3-70b-versatile",
                max_tokens=300
            )
            report_text = response.choices[0].message.content.strip()

            # Get top similar projects
            similar_projects = []
            
            # From idea check
            if "similar_projects" in analysis.get("idea_check", {}):
                similar_projects.extend(analysis["idea_check"]["similar_projects"][:3])
                
            # From code similarity
            if "similar_repos" in analysis.get("code_similarity", {}):
                for repo in analysis["code_similarity"]["similar_repos"][:5]:
                    if repo["name"] not in similar_projects:
                        similar_projects.append(f"{repo['name']} ({repo['similarity']:.2f})")
            
            # Limit to top 5
            similar_projects = similar_projects[:5]
            
            # Render with more detailed data
            template = self.env.get_template('report_template.html')
            html = template.render(
                report=report_text,
                project_name=analysis.get("metadata", {}).get("name", "Unknown"),
                originality_score=f"{analysis.get('originality', {}).get('originality_score', 0.0):.2f}",
                verdict=analysis.get("originality", {}).get("verdict", "Unknown"),
                idea_summary=analysis.get("idea_summary", "No summary available"),
                similar_projects=", ".join(similar_projects) or "None found",
                code_similarity=f"{analysis.get('code_similarity', {}).get('similarity_score', 0.0):.2f}",
                contrib_credibility=f"{analysis.get('contribution_credibility', {}).get('credibility_score', 0.0):.2f}"
            )
            pdf_path = os.path.join("static", "report.pdf")

            try:
                config = pdfkit.configuration(wkhtmltopdf=self.wkhtmltopdf_path)
                pdfkit.from_string(html, pdf_path, configuration=config)
                logger.info(f"Generated PDF at {pdf_path}")
                return "http://localhost:8000/static/report.pdf"
            except Exception as e:
                logger.error(f"Error generating PDF: {str(e)}")
                # Fallback to text file if PDF generation fails
                text_path = os.path.join("static", "report.txt")
                with open(text_path, "w", encoding="utf-8") as f:
                    f.write(report_text)
                return "http://localhost:8000/static/report.txt"
                
        except Exception as e:
            logger.error(f"Error generating report: {str(e)}")
            text_path = os.path.join("static", "report.txt")
            with open(text_path, "w", encoding="utf-8") as f:
                f.write("Report generation failed. Please try again.")
            return "http://localhost:8000/static/report.txt"