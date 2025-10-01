# Test Documentation

## Test Structure

The test suite is organized into the following directories:

```
tests/
├── __init__.py
├── conftest.py              # Pytest configuration and shared fixtures
├── unit/                    # Unit tests
│   ├── test_rag_system.py
│   └── test_language_detection.py
├── integration/             # Integration tests
│   ├── test_api_endpoints.py
│   ├── test_comparison_query_fix.py
│   └── test_language_fix.py
├── e2e/                     # End-to-end tests
│   ├── test_performance.py
│   └── test_original_performance.py
└── fixtures/                # Test fixtures and sample data
    ├── sample_documents.py
    └── __init__.py
```

## Test Categories

### Unit Tests (`tests/unit/`)
- **Purpose**: Test individual components in isolation
- **Scope**: Single functions, methods, or classes
- **Dependencies**: Minimal, mostly mocked
- **Speed**: Fast (< 1 second per test)

**Examples:**
- RAG system initialization
- Language detection functions
- Query validation and sanitization
- Data structure validation

### Integration Tests (`tests/integration/`)
- **Purpose**: Test component interactions
- **Scope**: Multiple components working together
- **Dependencies**: Some real components, some mocked
- **Speed**: Medium (1-10 seconds per test)

**Examples:**
- API endpoint functionality
- File upload and processing
- Database interactions
- External service integrations

### End-to-End Tests (`tests/e2e/`)
- **Purpose**: Test complete user workflows
- **Scope**: Full application stack
- **Dependencies**: Real components and services
- **Speed**: Slow (> 10 seconds per test)

**Examples:**
- Performance benchmarks
- Complete user journeys
- Load testing
- Memory usage testing

## Test Markers

Tests are categorized using pytest markers:

- `@pytest.mark.unit` - Unit tests
- `@pytest.mark.integration` - Integration tests  
- `@pytest.mark.e2e` - End-to-end tests
- `@pytest.mark.slow` - Slow tests (performance, load tests)
- `@pytest.mark.performance` - Performance-related tests

## Running Tests

### Using Make Commands

```bash
# Run all tests
make test

# Run specific test categories
make test-unit          # Unit tests only
make test-integration   # Integration tests only
make test-e2e          # End-to-end tests only
make test-fast         # Fast tests (exclude slow)
make test-slow         # Slow tests only

# Run with coverage
make test-cov

# Run with verbose output
make test-verbose

# Run performance tests
make test-perf
```

### Using Test Script

```bash
# Run all tests
./scripts/run_tests.sh all

# Run with coverage
./scripts/run_tests.sh all true

# Run with verbose output
./scripts/run_tests.sh all false true

# Run specific test type
./scripts/run_tests.sh unit
./scripts/run_tests.sh integration
./scripts/run_tests.sh e2e
```

### Using pytest directly

```bash
# Run all tests
pytest

# Run specific test categories
pytest -m unit
pytest -m integration
pytest -m e2e

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/unit/test_rag_system.py

# Run with verbose output
pytest -v

# Run fast tests only
pytest -m "not slow"
```

## Test Configuration

### pytest.ini
Main pytest configuration including:
- Test discovery patterns
- Default options
- Markers definition
- Logging configuration

### pyproject.toml
Project configuration including:
- Dependencies
- Tool configurations (black, flake8, mypy)
- Coverage settings

### conftest.py
Shared fixtures and configuration:
- Mock OpenAI API
- Mock Langfuse client
- Test data directories
- RAG system fixtures
- Web app fixtures

## Test Fixtures

### Common Fixtures

- `test_data_dir`: Temporary directory for test data
- `sample_documents_dir`: Directory with sample documents
- `rag_system`: RAG system instance for testing
- `web_app`: Flask test client
- `mock_openai_api`: Mocked OpenAI API calls
- `mock_langfuse`: Mocked Langfuse client

### Sample Data

Located in `tests/fixtures/sample_documents.py`:
- Sample insurance documents
- Test questions (Thai and English)
- Coaching scenarios
- Simulation scenarios

## Writing Tests

### Unit Test Example

```python
@pytest.mark.unit
def test_validate_query_valid(self, rag_system):
    """Test query validation with valid queries"""
    valid_queries = [
        "What are the benefits of insurance?",
        "วิธีจัดการคำคัดค้านเรื่องราคาประกัน"
    ]
    
    for query in valid_queries:
        is_valid, errors = rag_system.validate_query(query)
        assert is_valid
        assert len(errors) == 0
```

### Integration Test Example

```python
@pytest.mark.integration
@patch('src.interfaces.web.app.rag_system')
def test_ask_question_success(self, mock_rag_system, web_app):
    """Test successful question asking"""
    mock_rag_system.query.return_value = {
        "status": "success",
        "answer": "Test answer",
        "sources": []
    }
    
    response = web_app.post('/api/ask', 
                          json={'question': 'Test question'})
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'
```

### E2E Test Example

```python
@pytest.mark.slow
@pytest.mark.e2e
def test_performance_benchmark(self, rag_system, sample_questions):
    """Test performance under load"""
    start_time = time.time()
    
    for question in sample_questions:
        result = rag_system.query(question)
        assert result["status"] == "success"
    
    total_time = time.time() - start_time
    avg_time = total_time / len(sample_questions)
    
    assert avg_time < 5.0  # Performance threshold
```

## Best Practices

### Test Organization
1. **One test per behavior**: Each test should verify one specific behavior
2. **Descriptive names**: Test names should clearly describe what is being tested
3. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
4. **Independent tests**: Tests should not depend on each other

### Mocking Strategy
1. **Mock external dependencies**: API calls, file system, network requests
2. **Use real components when possible**: For integration tests, use real components when feasible
3. **Mock at boundaries**: Mock at the boundaries of your system, not internal components

### Performance Testing
1. **Set clear thresholds**: Define performance expectations
2. **Test realistic scenarios**: Use realistic data and scenarios
3. **Monitor resource usage**: Track memory, CPU, and time usage
4. **Test under load**: Include concurrent request testing

### Coverage Goals
- **Unit tests**: > 90% coverage
- **Integration tests**: > 80% coverage  
- **Critical paths**: 100% coverage
- **API endpoints**: 100% coverage

## Continuous Integration

Tests are automatically run in CI/CD pipeline:

1. **Pull Requests**: All tests run on every PR
2. **Main Branch**: Full test suite including slow tests
3. **Releases**: Performance benchmarks and load tests
4. **Coverage**: Coverage reports generated and tracked

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure `src/` is in Python path
2. **Mock Failures**: Check mock setup and return values
3. **Slow Tests**: Use `-m "not slow"` to skip slow tests during development
4. **Coverage Issues**: Ensure all code paths are tested

### Debug Tips

1. **Verbose Output**: Use `pytest -v` for detailed test output
2. **Single Test**: Run specific test with `pytest tests/unit/test_file.py::test_function`
3. **Print Statements**: Add print statements for debugging (remove before commit)
4. **Pytest Debugging**: Use `pytest --pdb` to drop into debugger on failure

## Contributing

When adding new tests:

1. **Follow naming conventions**: `test_*.py` files, `test_*` functions
2. **Add appropriate markers**: Use `@pytest.mark.unit/integration/e2e`
3. **Update documentation**: Add new test categories to this README
4. **Maintain coverage**: Ensure new code is tested
5. **Performance considerations**: Add performance tests for critical paths
