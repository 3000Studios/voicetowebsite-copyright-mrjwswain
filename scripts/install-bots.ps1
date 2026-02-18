# Install and pull recommended local/free models and runtimes.
# NOTE: This script only prints recommended commands. Run them interactively.

Write-Host "Recommended local setup steps for models and runtimes:`n"

Write-Host "1) Ollama (recommended for local model hosting):"
Write-Host "   - Install: https://ollama.com/docs/install"
Write-Host "   - Example pulls (run these after installing Ollama):"
Write-Host "     ollama pull ollama/qwen2.5-coder-7b"
Write-Host "     ollama pull ollama/vicuna-13b"
Write-Host "     ollama pull ollama/llama-2-13b-chat" -ForegroundColor Yellow

Write-Host "2) Llama.cpp / ggml variants (for CPU):"
Write-Host "   - Follow https://github.com/ggerganov/llama.cpp for building and running ggml models"
Write-Host "   - Example Vicuna/GGML models (if available from your provider):"
Write-Host "     (download weights to ./models and run via llama.cpp)"
Write-Host "   - Example download sources: Hugging Face model repos (may require HF token)"
Write-Host "     - Example: git lfs or `huggingface-cli` to download ggml weights to ./models" -ForegroundColor Yellow

Write-Host "3) Hugging Face Transformers (GPU recommended):"
Write-Host "   - Install Python deps: pip install -U transformers accelerate bitsandbytes" -ForegroundColor Yellow
Write-Host "   - Use model repos with `transformers` or `text-generation` tooling. Many HF models require API tokens and have usage limits."
Write-Host "   - To use Hugging Face Inference or pull large weights you may need an account and token."
Write-Host "     Example: `huggingface-cli login` then `huggingface-cli repo clone <model>` or use `git lfs` to fetch weights." -ForegroundColor Yellow

Write-Host "4) Notes / limitations:" -ForegroundColor Cyan
Write-Host "   - I cannot download model weights for you from this environment. Use the commands above locally to pull models."
Write-Host "   - 'Free with no limits' models generally do not exist—local models are limited by your hardware. Cloud-hosted models have provider limits or costs."

Write-Host "5) Quick example Ollama workflow (after installing Ollama):" -ForegroundColor Cyan
Write-Host "   ollama pull ollama/qwen2.5-coder-7b" -ForegroundColor Yellow
Write-Host "   ollama pull ollama/vicuna-13b" -ForegroundColor Yellow
Write-Host "   ollama run vicuna-13b --http" -ForegroundColor Yellow

Write-Host "6) Quick example llama.cpp ggml run (after placing weights in ./models):" -ForegroundColor Cyan
Write-Host "   ./build/bin/main -m ./models/ggml-vicuna-13b.bin -p 'Hello'" -ForegroundColor Yellow

Write-Host "If you want, run these commands locally and then start the Continue agent to use local models."
