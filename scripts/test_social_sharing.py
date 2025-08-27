#!/usr/bin/env python3
"""
Social sharing test script for Whenly event URLs.
This script simulates social media crawler requests to test meta tag injection.
"""

import requests
import json
import sys
import os
from urllib.parse import urljoin

def test_event_url(base_url, event_id):
    """Test a specific event URL for meta tags"""
    event_url = urljoin(base_url, f'/e/{event_id}')
    
    print(f"Testing event URL: {event_url}")
    print("=" * 60)
    
    try:
        # Make request with user agent that simulates a social media crawler
        headers = {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
        
        response = requests.get(event_url, headers=headers, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Content Type: {response.headers.get('content-type', 'Unknown')}")
        print()
        
        if response.status_code == 200:
            # Extract meta tags from the response
            html_content = response.text
            meta_tags = extract_meta_tags(html_content)
            
            print("Meta Tags Found:")
            print("-" * 30)
            for tag_name, tag_value in meta_tags.items():
                print(f"{tag_name}: {tag_value}")
            
            # Validate meta tags
            validate_meta_tags(meta_tags, event_url)
            
        else:
            print(f"Error: Received status code {response.status_code}")
            print(f"Response: {response.text[:500]}...")
            
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")
    
    print("\n" + "=" * 60 + "\n")

def extract_meta_tags(html_content):
    """Extract meta tags from HTML content"""
    import re
    
    meta_tags = {}
    
    # Extract title
    title_match = re.search(r'<title[^>]*>(.*?)</title>', html_content, re.IGNORECASE | re.DOTALL)
    if title_match:
        meta_tags['title'] = title_match.group(1).strip()
    
    # Extract meta tags
    meta_patterns = {
        'description': r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\'][^>]*>',
        'og:title': r'<meta[^>]*property=["\']og:title["\'][^>]*content=["\']([^"\']*)["\'][^>]*>',
        'og:description': r'<meta[^>]*property=["\']og:description["\'][^>]*content=["\']([^"\']*)["\'][^>]*>',
        'og:url': r'<meta[^>]*property=["\']og:url["\'][^>]*content=["\']([^"\']*)["\'][^>]*>',
        'og:image': r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']*)["\'][^>]*>',
        'og:type': r'<meta[^>]*property=["\']og:type["\'][^>]*content=["\']([^"\']*)["\'][^>]*>',
        'twitter:card': r'<meta[^>]*name=["\']twitter:card["\'][^>]*content=["\']([^"\']*)["\'][^>]*>',
        'twitter:title': r'<meta[^>]*name=["\']twitter:title["\'][^>]*content=["\']([^"\']*)["\'][^>]*>',
        'twitter:description': r'<meta[^>]*name=["\']twitter:description["\'][^>]*content=["\']([^"\']*)["\'][^>]*>',
        'twitter:image': r'<meta[^>]*name=["\']twitter:image["\'][^>]*content=["\']([^"\']*)["\'][^>]*>',
        'twitter:url': r'<meta[^>]*name=["\']twitter:url["\'][^>]*content=["\']([^"\']*)["\'][^>]*>',
    }
    
    for tag_name, pattern in meta_patterns.items():
        match = re.search(pattern, html_content, re.IGNORECASE)
        if match:
            meta_tags[tag_name] = match.group(1).strip()
    
    return meta_tags

def validate_meta_tags(meta_tags, event_url):
    """Validate that required meta tags are present and correct"""
    print("\nMeta Tag Validation:")
    print("-" * 30)
    
    required_tags = [
        'title', 'description', 'og:title', 'og:description', 
        'og:url', 'og:image', 'twitter:title', 'twitter:description'
    ]
    
    missing_tags = []
    for tag in required_tags:
        if tag not in meta_tags or not meta_tags[tag]:
            missing_tags.append(tag)
        else:
            print(f"✓ {tag}: Present")
    
    if missing_tags:
        print(f"✗ Missing tags: {', '.join(missing_tags)}")
    else:
        print("✓ All required meta tags are present!")
    
    # Check for specific validations
    if 'og:url' in meta_tags and meta_tags['og:url'] != event_url:
        print(f"⚠ Warning: og:url ({meta_tags['og:url']}) doesn't match event URL ({event_url})")
    
    if 'title' in meta_tags and 'Whenly' not in meta_tags['title']:
        print("⚠ Warning: Title doesn't contain 'Whenly'")
    
    if 'description' in meta_tags and len(meta_tags['description']) < 50:
        print("⚠ Warning: Description seems too short")

def test_multiple_user_agents(base_url, event_id):
    """Test the same URL with different user agents to simulate various crawlers"""
    user_agents = {
        'Facebook': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Twitter': 'Twitterbot/1.0',
        'LinkedIn': 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
        'Slack': 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
        'WhatsApp': 'WhatsApp/2.19.81 A',
        'Discord': 'Discordbot/2.0 (+https://discordapp.com)',
        'Regular Browser': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    event_url = urljoin(base_url, f'/e/{event_id}')
    
    print(f"Testing different user agents for: {event_url}")
    print("=" * 80)
    
    for crawler_name, user_agent in user_agents.items():
        print(f"\nTesting with {crawler_name} user agent:")
        print("-" * 40)
        
        try:
            headers = {'User-Agent': user_agent}
            response = requests.get(event_url, headers=headers, timeout=10)
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                meta_tags = extract_meta_tags(response.text)
                title = meta_tags.get('title', 'No title found')
                description = meta_tags.get('description', 'No description found')
                
                print(f"Title: {title[:60]}...")
                print(f"Description: {description[:80]}...")
            else:
                print(f"Error: {response.status_code}")
                
        except Exception as e:
            print(f"Error: {e}")

def main():
    """Main function"""
    if len(sys.argv) < 3:
        print("Usage: python test_social_sharing.py <base_url> <event_id>")
        print("Example: python test_social_sharing.py http://localhost:5000 test-event-123")
        sys.exit(1)
    
    base_url = sys.argv[1]
    event_id = sys.argv[2]
    
    print("Whenly Social Sharing Meta Tag Test")
    print("=" * 50)
    print(f"Base URL: {base_url}")
    print(f"Event ID: {event_id}")
    print()
    
    # Test with Facebook crawler
    test_event_url(base_url, event_id)
    
    # Test with multiple user agents
    test_multiple_user_agents(base_url, event_id)
    
    print("\nTesting Complete!")
    print("\nNext steps:")
    print("1. Test with Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/")
    print("2. Test with Twitter Card Validator: https://cards-dev.twitter.com/validator")
    print("3. Test with LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/")

if __name__ == '__main__':
    main()
