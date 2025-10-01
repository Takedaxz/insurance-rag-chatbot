# UOB RM AI Assistant

A sophisticated AI-powered chatbot system designed specifically for UOB Relationship Manager training and support. The system provides three core modes: Knowledge Base Q&A, Coaching Assistant, and Simulation Training.

## 🏗️ System Architecture

:::mermaid
graph TD

    8["User<br>External Actor"]
    subgraph 1["Deployment &amp; Entry Points<br>Python, Vercel"]
        21["Main Application Entry Point<br>Python"]
        22["Web Application Entry Points<br>Python"]
        23["Vercel Deployment Config<br>JSON, Text"]
    end
    subgraph 2["Configuration<br>Python, ENV"]
        19["Application Configuration<br>Python"]
        20["Environment Variables<br>Text"]
    end
    subgraph 3["Data Management<br>Filesystem"]
        17["Document Storage<br>Filesystem"]
        18["Index Storage<br>Filesystem"]
    end
    subgraph 4["Interfaces<br>Python, Flask"]
        15["Terminal Interface<br>Python"]
        16["API Endpoint (Vercel)<br>Python"]
        subgraph 5["Web Interface<br>Flask, HTML"]
            13["Flask Application<br>Python, Flask"]
            14["Frontend Assets<br>HTML, CSS, JS"]
            %% Edges at this level (grouped by source)
            13["Flask Application<br>Python, Flask"] -->|Serves| 14["Frontend Assets<br>HTML, CSS, JS"]
        end
    end
    subgraph 6["Core RAG System<br>Python"]
        11["File Monitor<br>Python"]
        12["Langfuse Client<br>Python"]
        subgraph 7["RAG Engine<br>Python"]
            10["Index Management<br>Python"]
            9["Document Processing<br>Python"]
        end
        %% Edges at this level (grouped by source)
        11["File Monitor<br>Python"] -->|Signals changes to| 7["RAG Engine<br>Python"]
        7["RAG Engine<br>Python"] -->|Interacts with| 11["File Monitor<br>Python"]
        7["RAG Engine<br>Python"] -->|Logs to| 12["Langfuse Client<br>Python"]
    end
    %% Edges at this level (grouped by source)
    6["Core RAG System<br>Python"] -->|Accesses| 3["Data Management<br>Filesystem"]
    1["Deployment &amp; Entry Points<br>Python, Vercel"] -->|Launches| 4["Interfaces<br>Python, Flask"]
    2["Configuration<br>Python, ENV"] -->|Configures| 4["Interfaces<br>Python, Flask"]
    2["Configuration<br>Python, ENV"] -->|Configures| 6["Core RAG System<br>Python"]
    8["User<br>External Actor"] -->|Interacts with| 4["Interfaces<br>Python, Flask"]
    3["Data Management<br>Filesystem"] -->|Provides data to| 6["Core RAG System<br>Python"]
    4["Interfaces<br>Python, Flask"] -->|Communicates with| 6["Core RAG System<br>Python"]
:::

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd insurance-chatbot
   ```

2. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```

3. **Deploy with Docker**
   ```bash
   # Production deployment
   ./scripts/deploy.sh
   
   # Development deployment
   ./scripts/deploy.sh latest development
   ```

4. **Access the application**
   - Production: http://localhost:5500
   - Development: http://localhost:5501

### Manual Installation

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```

3. **Start the application**
   ```bash
   # Web interface
   python start_web.py
   
   # Terminal interface
   python main.py
   ```

## 🐳 Docker Deployment

### Production Deployment

```bash
# Build and start production containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Development Deployment

```bash
# Start development environment with hot reload
docker-compose --profile dev up -d

# Access development server
# http://localhost:5501
```

### Terminal Interface

```bash
# Start terminal interface
docker-compose --profile terminal up
```

### Custom Image Tags

```bash
# Deploy specific version
./scripts/deploy.sh v1.2.3

# Deploy development version
./scripts/deploy.sh dev development
```

## 🔧 Configuration

### Required Environment Variables

Create a `.env` file with the following variables:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional (for enhanced features)
LLAMA_CLOUD_API_KEY=your_llama_cloud_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here

# Langfuse Telemetry (Optional)
LANGFUSE_PUBLIC_KEY=your_langfuse_public_key_here
LANGFUSE_SECRET_KEY=your_langfuse_secret_key_here
```

### Docker Environment

The application supports the following Docker environment variables:

- `FLASK_ENV`: Set to `production` or `development`
- `APP_PORT`: Application port (default: 5500)
- `LOG_LEVEL`: Logging level (default: INFO)

## 📋 Features

### 🧠 Knowledge Mode
- Deep Q&A with document uploads
- Multi-language support (Thai/English)
- Real-time document processing
- Advanced search capabilities

### 🎯 Coaching Assistant
- On-demand sales coaching
- Competitive analysis guidance
- Objection handling training
- Communication skill development

### 🎮 Simulation & Training
- AI-powered role-play scenarios
- Realistic customer interactions
- Performance scoring and feedback
- Detailed analytics and improvement plans

## 🛠️ Development

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test
python test_performance.py
```

### Code Quality

```bash
# Format code
black .

# Lint code
flake8 .

# Type checking
mypy src/
```

### Docker Development

```bash
# Build development image
docker build --target development -t uob-rm-assistant:dev .

# Run development container
docker run -p 5501:5500 -v $(pwd):/app uob-rm-assistant:dev
```

## 🔄 CI/CD Pipeline

The project includes comprehensive CI/CD workflows:

### GitHub Actions Workflows

1. **CI/CD Pipeline** (`.github/workflows/ci-cd.yml`)
   - Code quality checks
   - Security scanning
   - Docker image building
   - Automated deployment

2. **Docker Build** (`.github/workflows/docker-build.yml`)
   - Multi-platform Docker builds
   - Container registry publishing
   - Automated image tagging

3. **Release Management** (`.github/workflows/release.yml`)
   - Automated releases
   - Changelog generation
   - Asset publishing

### Pipeline Stages

1. **Code Quality**
   - Python linting (flake8)
   - Type checking (mypy)
   - Code formatting (black)
   - Security scanning (Trivy)

2. **Testing**
   - Unit tests
   - Integration tests
   - Performance tests
   - Coverage reporting

3. **Build & Deploy**
   - Docker image building
   - Multi-platform support
   - Container registry publishing
   - Environment-specific deployments

## 📊 Monitoring & Observability

### Logging

```bash
# View application logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f web
```

### Health Checks

```bash
# Check application health
curl http://localhost:5500/

# Docker health check
docker-compose ps
```

### Performance Monitoring

- Built-in performance metrics
- Response time tracking
- Cache hit rate monitoring
- Quality score tracking

## 🔐 Security

### Container Security

- Non-root user execution
- Minimal base images
- Security scanning in CI/CD
- Vulnerability monitoring

### Application Security

- Environment variable protection
- Input validation
- Rate limiting
- Secure file handling

## 📚 API Documentation

### Web Interface Endpoints

- `GET /` - Homepage
- `GET /knowledge` - Knowledge mode interface
- `GET /coaching` - Coaching mode interface
- `GET /simulation` - Simulation mode interface
- `POST /api/ask` - Q&A endpoint
- `POST /api/upload` - File upload endpoint
- `GET /api/stats` - System statistics

### Terminal Interface Commands

- `upload <file>` - Upload documents
- `ask <question>` - Ask questions
- `ask_web <question>` - Ask with web search
- `stats` - View system statistics
- `list` - List uploaded files
- `reset` - Clear all data
- `monitor` - Toggle file monitoring

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using the port
   lsof -i :5500
   
   # Use different port
   export APP_PORT=5501
   ```

2. **Docker build failures**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

3. **API key issues**
   ```bash
   # Verify environment variables
   docker-compose exec web env | grep API_KEY
   ```

### Getting Help

- Check application logs: `docker-compose logs -f`
- Verify environment configuration
- Review Docker container status
- Check GitHub Actions workflow runs

## 📄 License

This project is proprietary software developed for UOB internal use.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📞 Support

For technical support or questions, please contact the development team or create an issue in the repository.