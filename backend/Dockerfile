# Use an official Python base image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy project files
COPY . /app

# Install dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Set environment variables from .env file at runtime
# These aren't baked in so secrets stay local

# Expose the port (Flask defaults to 5000)
EXPOSE 5000

# Run the Flask app
CMD ["python", "app.py"]
