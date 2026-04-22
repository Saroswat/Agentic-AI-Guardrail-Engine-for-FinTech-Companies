FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY run_backend.py ./run_backend.py

EXPOSE 8000

CMD ["python", "run_backend.py"]
