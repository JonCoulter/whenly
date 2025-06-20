FROM python:3.11-slim

WORKDIR /app

COPY . /app

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

COPY wait-for-it.sh /app/wait-for-it.sh
RUN chmod +x /app/wait-for-it.sh

EXPOSE 5000

CMD ["./wait-for-it.sh", "db:5432", "--", "gunicorn", "-b", "0.0.0.0:5000", "wsgi:app"]
