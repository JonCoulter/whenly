import re
import json
from flask import request, Response, render_template_string
from models import Event
from config import config

class MetaTagMiddleware:
    """
    Middleware for injecting dynamic meta tags for event URLs.
    Intercepts requests to event pages and injects appropriate meta tags
    for social sharing and SEO.
    """
    
    def __init__(self, app):
        self.app = app
        self.event_pattern = re.compile(r'^/e/([a-f0-9-]+)$')
        
    def __call__(self, environ, start_response):
        # Create request object
        req = request.__class__(environ)
        
        # Check if this is a request to an event page
        event_match = self.event_pattern.match(req.path)
        
        if event_match:
            event_id = event_match.group(1)
            return self.handle_event_request(event_id, environ, start_response, req)
        
        # For non-event requests, proceed normally
        return self.app(environ, start_response)
    
    def handle_event_request(self, event_id, environ, start_response, req):
        """Handle requests to event pages by injecting dynamic meta tags"""
        try:
            # Get event data from database using the existing app context
            from flask import current_app
            with current_app.app_context():
                event = Event.query.filter_by(id=event_id).first()
            
            if not event:
                # Event not found, return 404
                status = '404 Not Found'
                response_headers = [('Content-Type', 'text/html')]
                start_response(status, response_headers)
                return [b'<html><body><h1>Event not found</h1></body></html>']
            
            # Convert event to dict for easier access
            event_data = event.to_dict()
            
            # Generate meta tags
            meta_tags = self.generate_meta_tags(event_data, req)
            
            # Read the original index.html
            try:
                with open('frontend/index.html', 'r', encoding='utf-8') as f:
                    html_content = f.read()
            except FileNotFoundError:
                # If frontend isn't built yet, use the fallback template
                from flask import render_template_string
                with open('templates/fallback.html', 'r', encoding='utf-8') as f:
                    template_content = f.read()
                
                # Render the template with event data
                html_content = render_template_string(template_content, 
                    title=meta_tags["title"],
                    description=meta_tags['description'],
                    og_title=meta_tags['og:title'],
                    og_description=meta_tags['og:description'],
                    og_url=meta_tags['og:url'],
                    og_type=meta_tags['og:type'],
                    og_image=meta_tags['og:image'],
                    twitter_card=meta_tags['twitter:card'],
                    twitter_title=meta_tags['twitter:title'],
                    twitter_description=meta_tags['twitter:description'],
                    twitter_image=meta_tags['twitter:image'],
                    twitter_url=meta_tags['twitter:url'],
                    event_name=event_data.get('name', 'Event'),
                    creator_name=event_data.get('creatorName', 'Anonymous'),
                    event_type=event_data.get('eventType', 'Unknown'),
                    specific_days=event_data.get('specificDays', []),
                    days_of_week=event_data.get('daysOfWeek', []),
                    time_start=event_data.get('timeRange', {}).get('start', ''),
                    time_end=event_data.get('timeRange', {}).get('end', '')
                )
                return [html_content.encode('utf-8')]
            
            # Inject meta tags into the HTML
            modified_html = self.inject_meta_tags(html_content, meta_tags)
            
            # Return the modified HTML
            status = '200 OK'
            response_headers = [('Content-Type', 'text/html; charset=utf-8')]
            start_response(status, response_headers)
            return [modified_html.encode('utf-8')]
            
        except Exception as e:
            # Log error and fall back to original behavior
            print(f"Error in meta tag middleware: {str(e)}")
            return self.app(environ, start_response)
    
    def generate_meta_tags(self, event_data, req):
        """Generate meta tags for the event"""
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
    
    def inject_meta_tags(self, html_content, meta_tags):
        """Inject meta tags into the HTML head section"""
        import re
        
        # Find the head tag
        head_start = html_content.find('<head>')
        if head_start == -1:
            return html_content
        
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
