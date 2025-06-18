import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Typography } from "@mui/joy";
import { Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { styled } from "@mui/joy/styles";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SearchIcon from "@mui/icons-material/Search";
import gsap from "gsap";

const PageWrapper = styled("div")({
  backgroundColor: "#070F18",
  minHeight: "100vh",
  fontFamily: "Poppins, sans-serif",
  color: "#E28A69",
});

const Header = styled("div")({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1.5rem 1.5rem",
});

const Brand = styled(Typography)({
  fontFamily: "Montserrat, sans-serif",
  fontSize: "1.8rem",
  fontWeight: "bold",
  color: "#E28A69",
});

const HelpIcons = styled("div")({
  display: "flex",
  gap: "1rem",
  alignItems: "center",
  color: "#E28A69",
});

const FormContainer = styled("div")({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  // marginTop: "4rem",
  padding: "2rem",
});

const StyledInput = styled(Input)({
  padding: "0.75rem",
  marginBottom: "1rem",
  borderRadius: "8px",
  backgroundColor: "#1A1A2E",
  color: "#E28A69",
});

const ErrorMessage = styled("div")({
  backgroundColor: "#2C0B0E",
  color: "#FF6B6B",
  border: "1px solid #FF6B6B",
  padding: "0.75rem 1rem",
  borderRadius: "8px",
  marginTop: "1rem",
  marginBottom: "1.5rem",
  fontFamily: "Poppins, sans-serif",
  fontWeight: 400,
  textAlign: "center",
});

const Footer = styled("footer")({
  marginTop: "4rem",
  padding: "1.5rem 2rem",
  textAlign: "center",
  color: "#E28A69",
  fontSize: "12px",
  fontFamily: "Poppins, sans-serif",
  position: "relative",
  zIndex: 2,
});

function InputForm() {
  useEffect(() => {
    const canvas = document.getElementById("matrix-canvas");
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.height = window.innerHeight;
      canvas.width = window.innerWidth;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const chars = "アァイィウエカキクケコサシスセソタチツ".split("");
    const fontSize = 20;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array.from({ length: columns }).fill(1);

    function draw() {
      ctx.fillStyle = "rgba(7, 15, 24, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0F0";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    const interval = setInterval(draw, 33);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const [repoLink, setRepoLink] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!repoLink.trim()) {
      setError("Please enter a GitHub repository URL");
      return;
    }
    if (!repoLink.includes("github.com")) {
      setError("Please enter a valid GitHub repository URL");
      return;
    }
    setError("");
    // Navigate to RepoAnalyzer with repoLink
    navigate("/repo-analyzer", { state: { repoLink: repoLink.trim() } });
  };

  return (
    <PageWrapper>
      <canvas
        id="matrix-canvas"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 0,
          width: "100vw",
          height: "100vh",
          opacity: 0.2,
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Header>
          <Brand>RepoRadar</Brand>
          <HelpIcons>
            <a href="#">
              <HelpOutlineIcon style={{ color: "#E28A69", fontSize: "20px" }} />
            </a>
          </HelpIcons>
        </Header>

        <FormContainer>
          <Container>
            <Row className="justify-content-center">
              <Col>
                <Typography
                  level="h4"
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    color: "#E28A69",
                    textAlign: "center",
                    // fontSize: "100px",
                    fontSize: { xs: "75px", sm: "100px" },
                    fontFamily: "Montserrat, sans-serif",
                  }}
                >
                  YOU CAN'T COPY
                </Typography>
                <form
                  onSubmit={handleSubmit}
                  className="d-flex flex-column justify-center align-items-center"
                >
                  <Typography level="h5" sx={{ mb: 2, fontWeight: 500 }}>
                    Enter GitHub Repository URL
                  </Typography>
                  <StyledInput
                    type="text"
                    sx={{ fontFamily: "Poppins, sans-serif" }}
                    placeholder="https://github.com/user/repo"
                    value={repoLink}
                    onChange={(e) => setRepoLink(e.target.value)}
                    fullWidth
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
                  />
                  {error && <ErrorMessage>{error}</ErrorMessage>}
                  <Button
                    type="submit"
                    startDecorator={<SearchIcon />}
                    sx={{
                      backgroundColor: "#E28A69",
                      fontFamily: "Poppins, sans-serif",
                      color: "#070F18",
                      padding: "0.75rem",
                      fontWeight: "bold",
                      borderRadius: "8px",
                      "&:hover": {
                        backgroundColor: "#d3775f",
                      },
                    }}
                  >
                    Analyze
                  </Button>
                </form>
              </Col>
            </Row>
          </Container>
        </FormContainer>
        <Footer>
          &copy; {new Date().getFullYear()} RepoRadar. Made with 💻 and ☕ by
          Team Visionaries.
        </Footer>
      </div>
    </PageWrapper>
  );
}

export default InputForm;
