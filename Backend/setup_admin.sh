#!/bin/bash

# Apply database migrations
echo "Applying migrations..."
python manage.py migrate

# Create superuser if it doesn't exist
echo "Checking superuser status..."
python create_superuser.py
