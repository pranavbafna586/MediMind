FROM python:3.9-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Create .env file - this will be overridden in production
RUN echo "GEMINI_API_KEY=AIzaSyAFCHmz7n8PVvM2fjd3KVd1FBv5kPCIyQk" > .env

# Expose the port the app runs on
EXPOSE 8080

# Run the application with Gunicorn
CMD exec gunicorn --bind :8080 --workers 1 --threads 8 --timeout 0 app:app