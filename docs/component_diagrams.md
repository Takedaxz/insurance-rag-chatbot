# UOB RM AI Assistant - Component Diagrams

## 📊 **Component Interaction Diagrams**

# 📚 **MODE 1: Knowledge Mode Flows**

## **1.1 Knowledge Mode Request Flow**

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant F as Flask Server
    participant KS as Knowledge Service
    participant R as RAGSystem
    participant FA as FAISS VectorStore
    participant O as OpenAI API
    participant C as LRU Cache

    U->>F: POST /api/ask (question)
    F->>F: Authenticate user
    F->>KS: process_knowledge_query(question)

    KS->>KS: Validate query quality
    KS->>C: Check query cache
    alt Cache hit
        C-->>KS: Return cached result
        KS-->>F: Return cached answer
    else Cache miss
        KS->>R: query_with_context(question)
        R->>R: Analyze insurance intent
        R->>R: Enhance query with keywords
        R->>FA: similarity_search(query_embedding, k=5)
        FA-->>R: Return relevant document chunks

        R->>R: Build insurance-specific prompt
        R->>O: Generate completion (GPT-4o-mini)
        O-->>R: Return contextual answer

        R->>C: Cache result with TTL
        R-->>KS: Return answer with sources
    end

    KS->>KS: Format response with citations
    KS-->>F: Return knowledge response
    F-->>U: JSON (answer, sources, confidence, cache_status)
```

# 🎯 **MODE 2: Coaching Mode Flows**

## **2.1 Coaching Mode Request Flow**

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant F as Flask Server
    participant CS as Coaching Service
    participant R as RAGSystem
    participant A as Analytics Service
    participant DB as Database

    U->>F: POST /api/coaching (question, context)
    F->>F: Authenticate user
    F->>CS: process_coaching_request(question, context)

    CS->>CS: Detect coaching intent (product/sales/communication)
    CS->>A: Retrieve user coaching history
    A->>DB: Query past sessions
    DB-->>A: Return user performance data

    CS->>R: retrieve_best_practices(intent, user_level)
    R->>R: Search coaching methodologies
    R-->>CS: Return relevant coaching content

    CS->>CS: Generate personalized advice
    CS->>CS: Create practice exercises
    CS->>A: Store coaching interaction
    A->>DB: Save session data

    CS-->>F: Return coaching response
    F-->>U: JSON (advice, insights, exercises, progress)
```

---

# 🎮 **MODE 3: Simulation Mode Flows**

## **3.1 Enhanced Simulation Flow with Real-Time KYC Validation**

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant F as Flask Server
    participant SIM as Simulation Service
    participant R as RAGSystem
    participant KYC as RealTimeKYCValidator

    %% Start Simulation with KYC Monitoring
    U->>F: POST /api/simulation (mode=text, enable_kyc=true)
    F->>SIM: start_simulation(scenario, mode='text', kyc_enabled=true)
    SIM->>SIM: Generate customer scenario
    SIM->>KYC: initialize_validator(session_id)
    KYC->>KYC: Setup 4-step KYC checklist
    SIM-->>F: Return scenario_data + kyc_status
    F-->>U: Display simulation interface + KYC progress bar

    %% Text Mode Conversation with Real-Time KYC
    U->>F: POST /api/simulation (respond, rm_message)
    F->>SIM: process_response(rm_message, mode='text')
    SIM->>KYC: validate_turn(rm_message, customer_response)
    KYC->>KYC: Check current KYC step compliance
    alt KYC Step Passed
        KYC-->>SIM: {"passed": true, "step_completed": "step_1", "feedback": "✅ Great!"}
        SIM->>R: Generate positive customer response
    else KYC Step Needs Improvement
        KYC-->>SIM: {"passed": false, "feedback": "⚠️ Ask for contact info", "violations": []}
        SIM->>R: Generate customer objection/delay
    end
    SIM-->>F: Return (response, kyc_validation, score_update)
    F-->>U: Display response + real-time KYC feedback

    %% Voice Mode Toggle (Optional Enhancement)
    U->>F: Click "Enable Voice" button
    Note over U,F: Voice services check availability
    alt Voice services available
        F->>F: Return websocket_url
        U->>WS: Connect to WebSocket
        WS->>SIM: Upgrade to voice mode
    else Voice services unavailable
        F-->>U: Show text-only notification
        Note over U,F: Graceful fallback to text mode
    end

    %% Voice Mode Conversation with KYC (Optional)
    U->>WS: Send audio data
    WS->>VS: speech_to_text(audio)
    VS-->>WS: Return transcription
    WS->>SIM: process_response(transcription, mode='voice')
    SIM->>KYC: validate_turn(transcription, response)
    KYC->>KYC: Apply same KYC rules to voice input
    SIM->>R: Generate response based on KYC validation
    WS->>VS: text_to_speech(response)
    VS-->>WS: Return audio
    WS-->>U: Send (text, audio, kyc_validation, progress_update)

    %% End Simulation with KYC Report
    U->>F: POST /api/simulation (end)
    F->>SIM: end_simulation()
    SIM->>KYC: get_final_compliance_report()
    KYC-->>SIM: {"compliance_score": 75, "completed_steps": 3, "violations": [...], "recommendations": [...]}
    SIM-->>F: Return comprehensive performance report
    F-->>U: Display final report with KYC breakdown
```

### **3. File Upload & Processing Flow**

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant F as Flask Server
    participant FM as FileMonitor
    participant R as RAGSystem
    participant L as LangChain Loader
    participant TS as TextSplitter
    participant O as OpenAI Embeddings
    participant FA as FAISS VectorStore

    U->>F: POST /api/upload (file)
    F->>F: Validate file (type, size, auth)
    F->>F: Save file to data/documents/

    F->>R: ingest_file(file_path)
    R->>L: Load document (PDF/Excel/TXT)
    L-->>R: Return Document objects

    R->>TS: split_documents(docs, chunk_size=500)
    TS-->>R: Return text chunks

    R->>O: generate embeddings (batch)
    O-->>R: Return embeddings vectors

    R->>FA: add_documents(vectors, metadata)
    FA-->>R: Confirm storage

    R-->>F: Return success (chunks_created, file_info)
    F->>FM: Notify file monitor (update processed_files)
    F-->>U: Success response

    Note over FM: Automatic monitoring<br/>New files trigger ingestion
```

### **4. Coaching Mode Decision Flow**

```mermaid
flowchart TD
    A[User Asks Question] --> B{Detect Intent}

    B --> C{Is Product Question?}
    C -->|Yes| D[Product Knowledge Mode]
    C -->|No| E{Is Objection Handling?}

    E -->|Yes| F[Objection Handling Mode]
    E -->|No| G{Is Communication?}

    G -->|Yes| H[Communication Mode]
    G -->|No| I{Is Sales Process?}

    I -->|Yes| J[Sales Process Mode]
    I -->|No| K[General Coaching Mode]

    D --> L[Query RAG with Product Context]
    F --> L
    H --> L
    J --> L
    K --> L

    L --> M[Generate Enhanced Prompt]
    M --> N[Call OpenAI with Context]
    N --> O[Post-process Response]
    O --> P[Return Answer + Insights + Suggestions]
```

### **5. Real-time KYC Compliance Monitoring**

```mermaid
stateDiagram-v2
    [*] --> Greeting: Start Simulation

    Greeting --> NameCollection: Greeting completed
    NameCollection --> AgeVerification: Name collected
    AgeVerification --> Occupation: Age verified
    Occupation --> IncomeDiscussion: Occupation identified
    IncomeDiscussion --> ProductInterest: Income discussed
    ProductInterest --> RiskAssessment: Interest shown
    RiskAssessment --> [*]: Compliance complete

    Greeting --> Violation: Greeting skipped
    NameCollection --> Violation: Required info missed
    AgeVerification --> Violation: Age not verified
    Occupation --> Violation: Occupation not asked
    IncomeDiscussion --> Violation: Budget not discussed
    ProductInterest --> Violation: No interest assessment
    RiskAssessment --> Violation: Risks not explained

    Violation --> [*]: Major violation detected

    note right of Greeting
        Check: Proper introduction,
        Professional greeting
    end note

    note right of NameCollection
        Check: Ask for full name,
        Verify spelling
    end note

    note right of AgeVerification
        Check: Confirm age suitability,
        Product appropriateness
    end note

    note right of IncomeDiscussion
        Check: Budget discussion,
        Affordability assessment
    end note

    note right of RiskAssessment
        Check: Explain risks,
        Get acknowledgment
    end note
```

## 🏗️ **Class Relationship Diagrams**

### **Core System Classes**

```mermaid
classDiagram
    class RAGSystem {
        +embeddings: OpenAIEmbeddings
        +llm: ChatOpenAI
        +text_splitter: RecursiveCharacterTextSplitter
        +vectorstore: FAISS
        +query(question, use_web_search)
        +ingest_file(file_path)
        +get_stats()
    }

    class VoiceService {
        +elevenlabs: ElevenLabs
        +websocket_uri: str
        +process_conversation_turn()
        +text_to_speech()
        +speech_to_text()
        +start_websocket_server()
    }

    class KYCComplianceMonitor {
        +kyc_steps: Dict[KYCStep, KYCValidation]
        +current_step_index: int
        +analyze_conversation_turn()
        +get_overall_kyc_score()
    }

    class AppConfig {
        +database: DatabaseConfig
        +openai: OpenAIConfig
        +rag: RAGConfig
        +security: SecurityConfig
        +flask: FlaskConfig
        +monitoring: MonitoringConfig
        +optional_services: OptionalServicesConfig
        +validate()
        +to_dict()
        +get_available_services()
    }

    RAGSystem --> AppConfig
    VoiceService --> AppConfig
    KYCComplianceMonitor --> AppConfig
```

### **Data Models**

```mermaid
classDiagram
    class QueryAnalysis {
        +original_query: str
        +enhanced_query: str
        +keywords: List[str]
        +intent: str
        +language: str
        +confidence: float
        +suggestions: List[str]
    }

    class RetrievalMetrics {
        +query_time: float
        +retrieval_time: float
        +generation_time: float
        +total_tokens: int
        +source_count: int
        +relevance_score: float
        +confidence_score: float
    }

    class VoiceSimulationMetrics {
        +session_id: str
        +duration: int
        +total_turns: int
        +kyc_compliance_score: float
        +communication_score: float
        +voice_quality_score: float
        +kyc_steps_completed: int
        +violations_count: int
        +customer_satisfaction: float
    }

    class KYCValidation {
        +step: KYCStep
        +required_questions: List[str]
        +validation_patterns: List[str]
        +score_weight: int
        +completed: bool
        +score_earned: int
    }

    QueryAnalysis --> RAGSystem
    RetrievalMetrics --> RAGSystem
    VoiceSimulationMetrics --> VoiceService
    KYCValidation --> KYCComplianceMonitor
```

## 🔄 **State Management Diagrams**

### **Application State Flow**

```mermaid
stateDiagram-v2
    [*] --> Initializing: Application start

    Initializing --> LoadingConfig: Load environment variables
    LoadingConfig --> ValidatingConfig: Validate configuration
    ValidatingConfig --> InitializingServices: Setup services
    InitializingServices --> StartingWebServer: Start Flask server

    StartingWebServer --> Ready: Application ready
    Ready --> [*]: Shutdown

    Initializing --> Error: Configuration error
    LoadingConfig --> Error: Missing variables
    ValidatingConfig --> Error: Invalid values
    InitializingServices --> Error: Service failure
    StartingWebServer --> Error: Port binding failure

    Error --> [*]: Exit with error
```

### **Enhanced Simulation Session States**

```mermaid
stateDiagram-v2
    [*] --> Idle: User logged in

    Idle --> Starting: Click start simulation
    Starting --> ScenarioSelection: Choose scenario type
    ScenarioSelection --> TextModeReady: Start in text mode

    TextModeReady --> TextConversationActive: Begin text conversation

    TextConversationActive --> VoiceTogglePressed: User clicks "Enable Voice"
    VoiceTogglePressed --> CheckingVoiceServices: Check voice availability

    CheckingVoiceServices --> VoiceInitializing: Voice services available
    CheckingVoiceServices --> TextConversationActive: Voice unavailable (fallback)

    VoiceInitializing --> VoiceConversationActive: Voice/WebSocket ready
    VoiceInitializing --> TextConversationActive: Voice init failed (fallback)

    VoiceConversationActive --> ProcessingAudio: User speaks
    ProcessingAudio --> GeneratingResponse: STT complete
    GeneratingResponse --> AnalyzingKYC: Response generated
    AnalyzingKYC --> SynthesizingAudio: KYC checked
    SynthesizingAudio --> VoiceConversationActive: Audio ready

    VoiceConversationActive --> VoiceToggleOff: User disables voice
    VoiceToggleOff --> TextConversationActive: Switch back to text

    TextConversationActive --> EndingSimulation: Time up or user ends
    VoiceConversationActive --> EndingSimulation: Time up or user ends

    EndingSimulation --> CalculatingMetrics: Process session data
    CalculatingMetrics --> GeneratingReport: Compute final scores
    GeneratingReport --> ReportDisplayed: Show results
    ReportDisplayed --> Idle: Back to dashboard

    Starting --> Error: Service unavailable
    CheckingVoiceServices --> Error: Voice services error
    VoiceInitializing --> Error: Voice init failed

    Error --> Idle: Return to dashboard with notification
```

## 🌐 **API State Transitions**

### **REST API State Machine**

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated

    Unauthenticated --> Authenticated: POST /login (success)
    Authenticated --> KnowledgeMode: GET /knowledge
    Authenticated --> CoachingMode: GET /coaching
    Authenticated --> SimulationMode: GET /simulation

    KnowledgeMode --> Querying: POST /api/ask
    Querying --> KnowledgeMode: Response received

    CoachingMode --> Coaching: POST /api/coaching
    Coaching --> CoachingMode: Response received

    SimulationMode --> SimulationStarting: POST /api/simulation (start)
    SimulationStarting --> VoiceActive: WebSocket connected
    VoiceActive --> VoiceActive: Audio exchange
    VoiceActive --> SimulationEnding: POST /api/simulation (end)
    SimulationEnding --> ReportView: Final report generated

    Authenticated --> Unauthenticated: POST /logout
    ReportView --> SimulationMode: Start new simulation

    note right of Unauthenticated
        User not logged in,
        Limited access
    end note

    note right of Authenticated
        User authenticated,
        Full access to modes
    end note

    note right of VoiceActive
        Real-time voice conversation,
        KYC monitoring active
    end note
```

## 📦 **Module Dependencies**

### **Import Relationship Graph**

```mermaid
graph TD
    A[web_app.py] --> B[src/interfaces/web/app.py]
    A --> C[src/core/rag_system.py]

    B --> D[src/config/settings.py]
    B --> E[src/core/file_monitor.py]
    B --> F[src/services/voice_service.py]
    B --> G[src/services/kyc_monitor.py]

    C --> D
    C --> H[langchain components]
    C --> I[faiss-cpu]

    F --> J[elevenlabs]
    F --> K[openai-whisper]

    G --> L[re module]

    D --> M[dataclasses]
    D --> N[pathlib]
    D --> O[os]

    E --> P[watchdog]
    E --> C

    H --> Q[langchain-openai]
    H --> R[langchain-community]
    H --> S[langchain-core]

    note right of D
        Centralized configuration
        management with validation
    end note

    note right of C
        Core AI logic with
        RAG implementation
    end note

    note right of F
        Voice processing services
        STT and TTS integration
    end note
```

## 🔄 **Data Processing Pipelines**

### **Document Ingestion Pipeline**

```mermaid
graph LR
    A[Raw Document<br/>PDF/Excel/TXT] --> B[File Type Detection]
    B --> C{Document Type}
    C -->|PDF| D[PyPDFLoader]
    C -->|Excel| E[Pandas + Unstructured]
    C -->|Text| F[TextLoader]

    D --> G[Document Objects]
    E --> G
    F --> G

    G --> H[Text Splitting<br/>chunk_size=500<br/>overlap=50]
    H --> I[Text Chunks<br/>List[Document]]

    I --> J[Embedding Generation<br/>OpenAI text-embedding-3-small]
    J --> K[Vector Embeddings<br/>768 dimensions]

    K --> L[FAISS Index<br/>Similarity Search]
    L --> M[Indexed Documents<br/>Persistent Storage]

    M --> N[Metadata Storage<br/>SQLite]
    N --> O[Ingestion Complete]
```

### **Voice Processing Pipeline**

```mermaid
graph LR
    A[Raw Audio<br/>WebM/16kHz/1ch] --> B[Audio Validation]
    B --> C[Format Conversion<br/>to WAV]
    C --> D[Speech-to-Text<br/>OpenAI Whisper]
    D --> E[Text Transcription<br/>Thai language]

    E --> F[Text Processing<br/>Intent Analysis]
    F --> G[RAG Query<br/>Context Retrieval]
    G --> H[LLM Response<br/>GPT-4o-mini]

    H --> I[KYC Compliance<br/>Real-time Analysis]
    I --> J[Response Enhancement<br/>With Feedback]

    J --> K[Text-to-Speech<br/>ElevenLabs API]
    K --> L[Audio Synthesis<br/>Voice Profile]
    L --> M[Audio Encoding<br/>Base64/WAV]

    M --> N[WebSocket Response<br/>Audio + Text + KYC]
    N --> O[Client Playback]
```

## 🎯 **Performance Monitoring Points**

### **Key Performance Indicators (KPIs)**

```mermaid
graph TD
    subgraph "Response Time KPIs"
        A1[Query Processing<br/>< 2s target] --> A2[Vector Search<br/>< 0.5s target]
        A2 --> A3[LLM Generation<br/>< 1s target]
        A3 --> A4[Total Response<br/>< 3s target]
    end

    subgraph "Voice KPIs"
        B1[STT Processing<br/>< 1s target] --> B2[TTS Synthesis<br/>< 2s target]
        B2 --> B3[WebSocket Latency<br/>< 100ms target]
        B3 --> B4[End-to-End Voice<br/>< 4s target]
    end

    subgraph "Quality KPIs"
        C1[KYC Compliance<br/>80%+ target] --> C2[Response Accuracy<br/>85%+ target]
        C2 --> C3[User Satisfaction<br/>90%+ target]
        C3 --> C4[Feature Adoption<br/>70%+ target]
    end

    subgraph "System KPIs"
        D1[CPU Usage<br/>< 70% target] --> D2[Memory Usage<br/>< 80% target]
        D2 --> D3[Error Rate<br/>< 1% target]
        D3 --> D4[Uptime<br/>99.9%+ target]
    end
```

These component diagrams provide a comprehensive view of how the UOB RM AI Assistant's various components interact, process data, and maintain state throughout the application lifecycle.
