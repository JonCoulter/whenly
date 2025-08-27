#!/usr/bin/env python3
"""
Test script for the meta tag middleware.
This script tests the middleware functionality by simulating requests to event URLs.
"""

import os
import sys
import tempfile
import unittest
from unittest.mock import Mock, patch, MagicMock

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from meta_middleware import MetaTagMiddleware
from models import Event
from datetime import datetime
import json

class TestMetaTagMiddleware(unittest.TestCase):
    """Test cases for the MetaTagMiddleware class"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.mock_app = Mock()
        self.middleware = MetaTagMiddleware(self.mock_app)
        
        # Create a sample event
        self.sample_event = Event(
            id='test-event-123',
            name='Test Team Meeting',
            event_type='specificDays',
            time_start='09:00 AM',
            time_end='10:00 AM',
            specific_days=json.dumps(['2024-01-15', '2024-01-16']),
            days_of_week=None,
            created_at=datetime.now(),
            created_by='test@example.com',
            creator_name='John Doe'
        )
    
    def test_event_pattern_matching(self):
        """Test that the event pattern correctly matches event URLs"""
        # Test valid event URL
        match = self.middleware.event_pattern.match('/e/test-event-123')
        self.assertIsNotNone(match)
        self.assertEqual(match.group(1), 'test-event-123')
        
        # Test invalid event URL
        match = self.middleware.event_pattern.match('/api/events/test-event-123')
        self.assertIsNone(match)
        
        # Test non-event URL
        match = self.middleware.event_pattern.match('/')
        self.assertIsNone(match)
    
    def test_generate_meta_tags(self):
        """Test meta tag generation"""
        # Create a mock request
        mock_request = Mock()
        mock_request.url_root = 'https://whenlymeet.com/'
        
        # Convert event to dict
        event_data = self.sample_event.to_dict()
        
        # Generate meta tags
        meta_tags = self.middleware.generate_meta_tags(event_data, mock_request)
        
        # Verify meta tags
        self.assertEqual(meta_tags['title'], 'Test Team Meeting - Whenly')
        self.assertIn('John Doe', meta_tags['description'])
        self.assertIn('Test Team Meeting', meta_tags['description'])
        self.assertEqual(meta_tags['og:title'], 'Test Team Meeting')
        self.assertEqual(meta_tags['og:url'], 'https://whenlymeet.com/e/test-event-123')
        self.assertEqual(meta_tags['twitter:title'], 'Test Team Meeting')
    
    def test_inject_meta_tags(self):
        """Test meta tag injection into HTML"""
        # Sample HTML content
        html_content = '''
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Whenly</title>
    <meta name="description" content="Whenly helps you easily find a time to meet">
    <meta property="og:title" content="Whenly - Effortless Group Scheduling">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
'''
        
        meta_tags = {
            'title': 'Test Event - Whenly',
            'description': 'Test description',
            'og:title': 'Test Event',
            'og:description': 'Test description',
            'og:url': 'https://whenlymeet.com/e/test-event-123',
            'og:type': 'website',
            'og:image': 'https://whenlymeet.com/og-image.png',
            'twitter:card': 'summary_large_image',
            'twitter:title': 'Test Event',
            'twitter:description': 'Test description',
            'twitter:image': 'https://whenlymeet.com/og-image.png',
            'twitter:url': 'https://whenlymeet.com/e/test-event-123'
        }
        
        # Inject meta tags
        modified_html = self.middleware.inject_meta_tags(html_content, meta_tags)
        
        # Verify modifications
        self.assertIn('<title>Test Event - Whenly</title>', modified_html)
        self.assertIn('content="Test description"', modified_html)
        self.assertIn('property="og:title" content="Test Event"', modified_html)
        self.assertIn('property="og:url" content="https://whenlymeet.com/e/test-event-123"', modified_html)
    
    def test_middleware_call_with_event_url(self):
        """Test middleware call with event URL"""
        # Create mock environment
        environ = {
            'PATH_INFO': '/e/test-event-123',
            'REQUEST_METHOD': 'GET',
            'HTTP_HOST': 'whenlymeet.com',
            'wsgi.url_scheme': 'https'
        }
        
        # Mock the database query
        with patch('meta_middleware.Event') as mock_event_class:
            mock_event_class.query.filter_by.return_value.first.return_value = self.sample_event
            
            # Mock file reading
            with patch('builtins.open', mock_open(read_data='<html><head><title>Whenly</title></head></html>')):
                # Mock start_response
                start_response = Mock()
                
                # Call middleware
                result = self.middleware(environ, start_response)
                
                # Verify that middleware handled the request
                self.mock_app.assert_not_called()
                start_response.assert_called_once()

def mock_open(mock_data):
    """Helper function to mock file open"""
    mock_file = MagicMock()
    mock_file.read.return_value = mock_data
    mock_file.__enter__.return_value = mock_file
    return Mock(return_value=mock_file)

if __name__ == '__main__':
    unittest.main()
