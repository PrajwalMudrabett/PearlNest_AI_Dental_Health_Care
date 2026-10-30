# Contributing to PERLNEST

Thank you for your interest in contributing to PERLNEST! This document provides guidelines for contributing to this dental AI research project.

## 🤝 How to Contribute

### Reporting Issues

If you find a bug or have a suggestion:

1. Check if the issue already exists in the [Issues](https://github.com/PrajwalMudrabett/PearlNest_AI_Dental_Health_Care/issues) section
2. If not, create a new issue with:
   - Clear, descriptive title
   - Detailed description of the problem/suggestion
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - System information (OS, Python version, etc.)
   - Screenshots if applicable

### Suggesting Enhancements

For feature requests or enhancements:

1. Open an issue with the "enhancement" label
2. Describe the feature and its benefits
3. Explain the use case
4. Consider implementation approach

### Pull Requests

#### Before You Start

1. Fork the repository
2. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make sure you can run the project locally

#### Making Changes

1. **Code Style**
   - Follow PEP 8 for Python code
   - Use meaningful variable and function names
   - Add comments for complex logic
   - Keep functions focused and modular

2. **Frontend Code**
   - Follow React best practices
   - Use functional components with hooks
   - Keep components small and reusable
   - Follow Tailwind CSS conventions

3. **Documentation**
   - Update README.md if needed
   - Add docstrings to functions
   - Comment complex algorithms
   - Update relevant .md files

4. **Testing**
   - Test your changes thoroughly
   - Verify models still load correctly
   - Check frontend builds without errors
   - Test on sample X-ray images

#### Submitting a Pull Request

1. Commit your changes:

   ```bash
   git add .
   git commit -m "Brief description of changes"
   ```

2. Push to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

3. Open a Pull Request with:
   - Clear title and description
   - Link to related issue (if applicable)
   - List of changes made
   - Screenshots (for UI changes)
   - Testing performed

4. Wait for review and address feedback

## 🎯 Areas for Contribution

### High Priority

- **Model 3 Improvements**
  - Better training strategies
  - Data augmentation techniques
  - Architecture experiments
  - See: `IMPROVE_MODEL3_ACCURACY.md`

- **Performance Optimization**
  - Faster inference
  - Memory optimization
  - Batch processing

- **UI/UX Enhancements**
  - Better visualization
  - More interactive features
  - Mobile responsiveness

### Medium Priority

- **Testing**
  - Unit tests for pipeline
  - Integration tests for API
  - Frontend component tests

- **Documentation**
  - Video tutorials
  - Architecture diagrams
  - API documentation

- **Features**
  - Export to PDF reports
  - Patient history tracking
  - Comparison tools

### Low Priority

- **Code Quality**
  - Refactoring
  - Type hints
  - Error handling

- **Internationalization**
  - Multi-language support
  - Localization

## 📋 Development Setup

### Prerequisites

- Python 3.8+
- Node.js 16+
- Git

### Setup Steps

1. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/PearlNest_AI_Dental_Health_Care.git
   cd PearlNest_AI_Dental_Health_Care
   ```

2. **Install Python dependencies**

   ```bash
   pip install -r requirements.txt
   ```

3. **Install frontend dependencies**

   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Verify setup**

   ```bash
   python verify_models.py
   ```

5. **Run the application**

   ```bash
   # Terminal 1
   python backend/api.py

   # Terminal 2
   cd frontend
   npm run dev
   ```

## 🧪 Testing Guidelines

### Before Submitting

1. **Python Code**

   ```bash
   # Check syntax
   python -m py_compile your_file.py

   # Run linter
   flake8 your_file.py
   ```

2. **Frontend Code**

   ```bash
   cd frontend
   npm run build  # Should complete without errors
   ```

3. **Manual Testing**
   - Test with sample X-ray images
   - Verify all features work
   - Check console for errors
   - Test on different browsers

### Test Cases

When adding new features, test:

- ✅ Happy path (expected usage)
- ✅ Edge cases (empty input, large files, etc.)
- ✅ Error handling (invalid input, network errors)
- ✅ Cross-browser compatibility (Chrome, Firefox, Safari)

## 📝 Code Style

### Python

```python
# Good
def calculate_overlap(tooth_box: list, finding_mask: np.ndarray) -> float:
    """
    Calculate spatial overlap between tooth and finding.

    Args:
        tooth_box: [x1, y1, x2, y2] bounding box
        finding_mask: Binary mask array

    Returns:
        Overlap ratio (0.0 to 1.0)
    """
    # Implementation
    pass

# Avoid
def calc(box,mask):
    # No docs, unclear names
    pass
```

### React/JavaScript

```javascript
// Good
const MedicalImageViewer = ({ result, isAnalyzing, onDownloadAnnotated }) => {
  const [zoom, setZoom] = useState(1.0);

  // Clear component logic
};

// Avoid
function viewer(props) {
  // Unclear naming, no destructuring
}
```

## 🚫 What Not to Contribute

Please **DO NOT** submit pull requests for:

- **Patient Data**: Never commit actual patient X-rays or medical data
- **Large Binary Files**: Model weights, datasets (use Git LFS or external storage)
- **Breaking Changes**: Major refactors without discussion
- **Credentials**: API keys, passwords, tokens
- **Proprietary Code**: Code from other projects without proper licensing

## 🔒 Security

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email the repository owner directly
3. Provide details about the vulnerability
4. Allow time for a fix before disclosure

## 📜 Code of Conduct

### Our Standards

- **Be Respectful**: Treat everyone with respect
- **Be Collaborative**: Work together constructively
- **Be Patient**: Help newcomers learn
- **Be Professional**: Keep discussions focused and productive

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or inflammatory comments
- Personal attacks
- Publishing others' private information
- Unethical or illegal activities

## 📧 Questions?

If you have questions about contributing:

1. Check existing [Issues](https://github.com/PrajwalMudrabett/PearlNest_AI_Dental_Health_Care/issues)
2. Open a new issue with the "question" label
3. Contact the repository owner

## 🙏 Recognition

Contributors will be recognized in:

- GitHub contributors list
- Project documentation
- Release notes

## 📖 Additional Resources

- [README.md](README.md) - Project overview
- [START_APPLICATION.md](START_APPLICATION.md) - Setup guide
- [IMPROVE_MODEL3_ACCURACY.md](IMPROVE_MODEL3_ACCURACY.md) - Model improvement
- [Python PEP 8 Style Guide](https://peps.python.org/pep-0008/)
- [React Documentation](https://react.dev/)

---

**Thank you for contributing to dental AI research! 🦷✨**
