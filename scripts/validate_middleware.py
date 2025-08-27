#!/usr/bin/env python3
"""
Simple validation script for the meta tag middleware.
This script tests the core logic without requiring the full Flask environment.
"""

import re
import json
from datetime import datetime

def test_event_pattern():
    """Test the event URL pattern matching"""
    print("Testing event URL pattern matching...")
    
    # Create the pattern
    event_pattern = re.compile(r'^/e/([a-f0-9-]+)$')
    
    # Test cases
    test_cases = [
        ('/e/test-event-123', True, 'test-event-123'),
        ('/e/550e8400-e29b-41d4-a716-446655440000', True, '550e8400-e29b-41d4-a716-446655440000'),
        ('/api/events/test-event-123', False, None),
        ('/e/', False, None),
        ('/e', False, None),
        ('/', False, None),
        ('/event/test-event-123', False, None),
    ]
    
    for url, should_match, expected_id in test_cases:
        match = event_pattern.match(url)
        if should_match:
            if match and match.group(1) == expected_id:
                print(f"✓ {url} -> {expected_id}")
            else:
                print(f"✗ {url} -> Expected {expected_id}, got {match.group(1) if match else None}")
        else:
            if not match:
                print(f"✓ {url} -> No match (correct)")
            else:
                print(f"✗ {url} -> Unexpected match: {match.group(1)}")

def test_meta_tag_generation():
    """Test meta tag generation logic"""
    print("\nTesting meta tag generation...")
    
    # Mock event data
    event_data = {
        'id': 'test-event-123',
        'name': 'Team Standup Meeting',
        'eventType': 'specificDays',
        'specificDays': ['2024-01-15', '2024-01-16', '2024-01-17'],
        'daysOfWeek': [],
        'createdBy': 'john@example.com',
        'creatorName': 'John Doe'
    }
    
    # Mock request
    class MockRequest:
        def __init__(self):
            self.url_root = 'https://whenlymeet.com/'
    
    req = MockRequest()
    
    # Generate meta tags
    meta_tags = generate_meta_tags(event_data, req)
    
    # Validate meta tags
    expected_tags = [
        'title', 'description', 'og:title', 'og:description', 
        'og:url', 'og:type', 'og:image', 'twitter:card', 
        'twitter:title', 'twitter:description', 'twitter:image', 'twitter:url'
    ]
    
    for tag in expected_tags:
        if tag in meta_tags and meta_tags[tag]:
            print(f"✓ {tag}: {meta_tags[tag][:50]}...")
        else:
            print(f"✗ {tag}: Missing or empty")
    
    # Specific validations
    if 'Team Standup Meeting' in meta_tags.get('title', ''):
        print("✓ Title contains event name")
    else:
        print("✗ Title missing event name")
    
    if 'John Doe' in meta_tags.get('description', ''):
        print("✓ Description contains creator name")
    else:
        print("✗ Description missing creator name")
    
    if 'https://whenlymeet.com/e/test-event-123' == meta_tags.get('og:url', ''):
        print("✓ og:url is correct")
    else:
        print("✗ og:url is incorrect")

def generate_meta_tags(event_data, req):
    """Generate meta tags for the event (copied from middleware)"""
    event_name = event_data.get('name', 'Whenly Event')
    creator_name = event_data.get('creatorName', 'Anonymous')
    
    # Create description
    if event_data.get('eventType') == 'specificDays':
        days = event_data.get('specificDays', [])
        if days:
            description = f"Join {creator_name} for '{event_name}' on {len(days)} selected day(s). Find the best time to meet with Whenly."
        else:
            description = f"Join {creator_name} for '{event_name}'. Find the best time to meet with Whenly."
    else:
        days = event_data.get('daysOfWeek', [])
        if days:
            description = f"Join {creator_name} for '{event_name}' on {', '.join(days)}. Find the best time to meet with Whenly."
        else:
            description = f"Join {creator_name} for '{event_name}'. Find the best time to meet with Whenly."
    
    # Get the full URL
    base_url = req.url_root.rstrip('/')
    event_url = f"{base_url}/e/{event_data.get('id')}"
    
    # Generate meta tags
    meta_tags = {
        'title': f"{event_name} - Whenly",
        'description': description,
        'og:title': event_name,
        'og:description': description,
        'og:url': event_url,
        'og:type': 'website',
        'og:image': f"{base_url}/og-image.png",
        'twitter:card': 'summary_large_image',
        'twitter:title': event_name,
        'twitter:description': description,
        'twitter:image': f"{base_url}/og-image.png",
        'twitter:url': event_url
    }
    
    return meta_tags

def test_html_injection():
    """Test HTML meta tag injection"""
    print("\nTesting HTML meta tag injection...")
    
    # Sample HTML content
    html_content = '''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Whenly</title>
    <meta name="description" content="Whenly helps you easily find a time to meet">
    <meta property="og:title" content="Whenly - Effortless Group Scheduling">
    <meta property="og:description" content="Find a time to meet with friends">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>'''
    
    meta_tags = {
        'title': 'Test Event - Whenly',
        'description': 'Test description for the event',
        'og:title': 'Test Event',
        'og:description': 'Test description for the event',
        'og:url': 'https://whenlymeet.com/e/test-event-123',
        'og:type': 'website',
        'og:image': 'https://whenlymeet.com/og-image.png',
        'twitter:card': 'summary_large_image',
        'twitter:title': 'Test Event',
        'twitter:description': 'Test description for the event',
        'twitter:image': 'https://whenlymeet.com/og-image.png',
        'twitter:url': 'https://whenlymeet.com/e/test-event-123'
    }
    
    # Inject meta tags
    modified_html = inject_meta_tags(html_content, meta_tags)
    
    # Check if modifications were made
    if '<title>Test Event - Whenly</title>' in modified_html:
        print("✓ Title was updated")
    else:
        print("✗ Title was not updated")
    
    if 'content="Test description for the event"' in modified_html:
        print("✓ Description was updated")
    else:
        print("✗ Description was not updated")
    
    if 'property="og:title" content="Test Event"' in modified_html:
        print("✓ og:title was updated")
    else:
        print("✗ og:title was not updated")
    
    if 'property="og:url" content="https://whenlymeet.com/e/test-event-123"' in modified_html:
        print("✓ og:url was updated")
    else:
        print("✗ og:url was not updated")

def inject_meta_tags(html_content, meta_tags):
    """Inject meta tags into the HTML head section (copied from middleware)"""
    # Replace the title tag
    title_pattern = re.compile(r'<title>.*?</title>', re.DOTALL)
    html_content = title_pattern.sub(f'<title>{meta_tags["title"]}</title>', html_content)
    
    # Remove existing meta tags that we want to replace
    meta_patterns = [
        r'<meta name="description"[^>]*>',
        r'<meta property="og:title"[^>]*>',
        r'<meta property="og:description"[^>]*>',
        r'<meta property="og:url"[^>]*>',
        r'<meta property="og:type"[^>]*>',
        r'<meta property="og:image"[^>]*>',
        r'<meta name="twitter:card"[^>]*>',
        r'<meta name="twitter:title"[^>]*>',
        r'<meta name="twitter:description"[^>]*>',
        r'<meta name="twitter:image"[^>]*>',
        r'<meta name="twitter:url"[^>]*>'
    ]
    
    for pattern in meta_patterns:
        html_content = re.sub(pattern, '', html_content, flags=re.IGNORECASE)
    
    # Build the new meta tags HTML
    new_meta_html = f"""
    <meta name="description" content="{meta_tags['description']}" data-rh="true">
    <meta property="og:title" content="{meta_tags['og:title']}" data-rh="true">
    <meta property="og:description" content="{meta_tags['og:description']}" data-rh="true">
    <meta property="og:url" content="{meta_tags['og:url']}">
    <meta property="og:type" content="{meta_tags['og:type']}">
    <meta property="og:image" content="{meta_tags['og:image']}" data-rh="true">
    <meta name="twitter:card" content="{meta_tags['twitter:card']}" data-rh="true">
    <meta name="twitter:title" content="{meta_tags['twitter:title']}" data-rh="true">
    <meta name="twitter:description" content="{meta_tags['twitter:description']}" data-rh="true">
    <meta name="twitter:image" content="{meta_tags['twitter:image']}" data-rh="true">
    <meta name="twitter:url" content="{meta_tags['twitter:url']}">
"""
    
    # Insert new meta tags before the closing head tag
    head_end = html_content.find('</head>')
    if head_end != -1:
        html_content = html_content[:head_end] + new_meta_html + html_content[head_end:]
    
    return html_content

def main():
    """Run all tests"""
    print("Whenly Meta Tag Middleware Validation")
    print("=" * 50)
    
    test_event_pattern()
    test_meta_tag_generation()
    test_html_injection()
    
    print("\n" + "=" * 50)
    print("Validation complete!")
    print("\nNext steps:")
    print("1. Build the frontend: make build-frontend")
    print("2. Start the backend server")
    print("3. Test with a real event URL")
    print("4. Use the social sharing test script: python scripts/test_social_sharing.py")

if __name__ == '__main__':
    main()
