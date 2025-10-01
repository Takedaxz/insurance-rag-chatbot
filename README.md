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
