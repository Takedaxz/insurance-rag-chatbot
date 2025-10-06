# RAG Chatbot System

This repository contains the code for an AI-powered employee assistant chatbot designed to provide comprehensive support and training for employees. The chatbot operates in three distinct modes: Knowledge Mode, Coaching Assistant Mode, and Simulation Mode.

## Project Structure

The project is structured to separate concerns and facilitate development:

- `main.py`: Entry point for the terminal-based RAG chatbot interface.
- `web_app.py`: Entry point for the web-based RAG chatbot interface, built with Flask.
- `src/`: Contains the core logic and interfaces for the chatbot.
  - `src/core/`: Core RAG system components, including file monitoring and RAG engine.
  - `src/interfaces/`: User interfaces, including terminal and web.
  - `src/config/`: Application configuration.
  - `src/data/`: Document and index storage.
- `data/`: Stores documents for the RAG system and FAISS indexes.
- `prd.md`: Product Requirements Document detailing the chatbot's features and objectives.
- `requirements.txt`: Lists all Python dependencies required to run the system.

## Features

The chatbot offers the following key features across its three modes:

### Knowledge Mode
Acts as an instant, in-depth encyclopedia for all company-related information.
- **Deep Q&A Engine:** Answers detailed, multi-step questions about internal processes, sales procedures, and product specifications.
- **Centralized Knowledge Base:** Powered by a comprehensive and up-to-date knowledge base including product portfolios, company regulations, and standard operating procedures.
- **Case Overview Generation:** Provides summaries on how to approach cases based on initial parameters.

### Coaching Assistant Mode
Acts as an on-demand coach that listens and provides guidance to improve employee effectiveness.
- **Competitive Analysis:** Compares products against competitors, highlighting unique selling points.
- **Key Phrase & Keyword Suggestion:** Identifies and suggests impactful keywords and talking points for customer conversations.
- **Scenario-Based Guidance:** Offers structured advice for hypothetical customer problems and difficult objections.
- **Response Formulation:** Suggests potential answers to customer queries.

### Simulation & Training Mode
Provides a realistic role-playing environment for employees to practice and receive feedback.
- **Realistic Customer Simulation:** Generates and role-plays as a virtual customer for interactive dialogues.
- **Dynamic Conversation Flow:** Supports full, interactive dialogues, including advanced requirements for simulating realistic voice and emotions.
- **Performance Feedback & Scoring:** Provides a performance report with constructive feedback and a quantitative score based on predefined metrics.

## Installation and Setup

### Prerequisites

- Python 3.8+
- Conda (recommended for environment management)

### Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/takedaxz/insurance-rag-chatbot.git
    cd insurance-rag-chatbot
    ```

2.  **Create and activate a Conda environment:**
    ```bash
    conda create -n [XXX] python=3.11 -y
    conda activate XXX
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Prepare the knowledge base:**
    Place your `.txt` and `.pdf` documents in the `data/documents/` directory. The system will automatically process these documents to build the knowledge base.

## Running the Application

### Terminal Interface

To run the chatbot in terminal mode:

```bash
python main.py
```

### Web Interface

To run the chatbot with the web interface (Flask):

```bash
python web_app.py
```
The web application will typically run on `http://0.0.0.0:5500` by default. You can configure the `FLASK_ENV` environment variable for development mode.

## Dependencies

The project utilizes several key Python libraries:

- `flask`: Web framework for the web interface.
- `langchain`: Framework for developing applications powered by language models.
- `langchain-openai`: OpenAI integration for Langchain.
- `langchain-community`: Community integrations for Langchain.
- `openai`: OpenAI Python client library.
- `python-dotenv`: For managing environment variables.
- `pandas`, `openpyxl`: For document processing.
- `faiss-cpu`: For efficient similarity search and clustering of dense vectors (vector storage).
- `watchdog`: For monitoring file system events.
- `rich`: For rich text and beautiful formatting in the terminal.

## Contributing

We welcome contributions! Please see `CONTRIBUTING.md` (if available) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
